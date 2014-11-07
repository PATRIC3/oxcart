
/* 
 * App Tasker Model (appUI service)
 *
 *   This is responisble for the state of the app runner model
 *   Two way binding is used to update the view
 *
*/

angular.module('appTasker')
.service('appUI', ['$http', '$rootScope', 'uiTools', '$q', 'authService',
    function($http, $rootScope, uiTools, $q, authService) {

    var self = this;

    // default workspace; used at the start of the application
    var default_ws = authService.user+":home";

    // models for methods; two for faster retrieval and updating of templates
    this.apps = [];
    this.appDict = {};

    // model for cells displayed (not in use)
    this.cells = [];

    // current selected app
    this.currentApp;

	// model for ws objects in 'data' view
    this.current_ws = default_ws;
	this.ws_objects;
    this.wsObjsByType;

	// model for tasks; appears in 'running tasks'
	this.tasks = [];

    // add cell to app builder model
    this.addCell = function(name) {
        var cell_obj = self.appDict[name];
        self.cells.push(cell_obj);
    }

    // remove cell from app builder model
    this.removeCell = function(index) {
		this.cells.splice(index, 1);
    }

    // set current working app
    this.setApp = function(name) {
        var cell_obj = self.appDict[name];
        console.log(self.appDict[name])
        self.currentApp = cell_obj;
    }

    // a task is of the form {name: cell.title, fields: scope.fields}
    this.newTask = function(task) {
    	self.tasks.push(task);
    }


    // This is the true app service/api
    // We are using this for demonstration of the functionality for now
    $http.rpc('app', 'enumerate_apps')
         .then(function(apps) {
            self.apps = apps;

            var appDict = {}
            for (var i=0; i<apps.length; i++) {
                //{label: apps[i].label, description: apps[i].description}
                appDict[apps[i].id] = apps[i];
            }

            self.appDict = appDict;

            self.appTable = getColumns(self.apps, 2);    
        })


    // additional, hard-coded apps for now
    // this.appList = [{name: 'Assemble', disabled: true},
    //                {name: 'Annotate', id: 'Annotate-ContigSet'}];
                    /*
                    {name: 'Generate Initial Model', id: 'Build-a-Metabolic-Model'},
                    {name: 'Gapfill Model', id: 'Gapfill-a-Metabolic-Model'},
                    {name: 'Run FBA', id: 'Run-Flux-Balance-Analysis'},
                    {name: 'Assemble Genome', id: 'Assemble-Genome-from-Fasta'},                    
                    {name: 'Genome Import', id: 'Import-NCBI-Genome'},
                    {name: 'Reconcile Giving New Model', id: 'Build-a-Metabolic-Model'},
                    {name: 'Model Input', disabled: true},
                    {name: 'Model Translation', disabled: true},
                    {name: 'Comparative Genomes', disabled: true}];*/




    // Load data for apps and app builder
    /*
    $http.get('data/services.json').success(function(data) {
        // reorganize data since it doesn't make any sense.  
        // why is there no order to the groups of methods?
        var methods = [];
        var method_dict = {}
        for (var key in data) {
            var group_name = key
            var method = {name: group_name, methods: []}

            var nar_meths = data[group_name].methods;

            for (var i in nar_meths) {
                var meth = nar_meths[i];

                // use title with hypens as method id for now
                var id = meth.title.replace(/ /g, '-'); 

                var obj = {title: meth.title,
                           description: meth.description,
                           input: meth.properties.widgets.input,
                           output: meth.properties.widgets.output,
                           params: sanitize(meth.properties.parameters, 'param'),
                           returns: sanitize(meth.returns, 'output')};

                // use ui_name with hypens as field ids for now
                for (var j in obj.params) {
                    obj.params[j].id = obj.params[j].ui_name.replace(/ /g, '-');
                }


                method_dict[id] = obj;

                var meta = {title: meth.title,
                            description: meth.description}
                method.methods.push(meta);                
            }

            methods.push(method);
        }

        // update models, two-way-binding ftw.
        //self.methods = methods;
        //self.method_dict = method_dict;

        // append some descriptions to choosen apps for now
        for (var i=0; i<self.appList.length; i++) {
            var id = self.appList[i].id;
            if (id) {
                self.appList[i].description = self.method_dict[id].description;
            }
        }
    });*/


    // change param0, param1, etc... to a list.  not sure why.
    function sanitize(properties, key_prefix) {
        var props = [];

        for (var i=0; i<Object.keys(properties).length; i++) {
            var key = key_prefix+String(i);
            props.push(properties[key]);
        }
        return props;
    }

    // takes array and divides it into columns of arbitrary 'size'
    function getColumns(list, size) {
        var col_length = Math.ceil(list.length / size)

        var cols = [];
        for (var i=0; i<size; i++) {
            cols.push(list.slice(i*col_length, (i+1)*col_length));
        }
        return cols;
    }

    // initial fetch of user's writable workspace list
    this.getWS = $http.rpc('ws', 'list_workspace_info', {perm: 'w'} )
        .then(function(workspaces) {
        var workspaces = workspaces.sort(compare)

        function compare(a,b) {
            var t1 = uiTools.getTimestamp(b[3]) 
            var t2 = uiTools.getTimestamp(a[3]) 
            if (t1 < t2) return -1;
            if (t1 > t2) return 1;
            return 0;
        }

        var ws_list = [];
        for (var i in workspaces) {
            ws_list.push({name: workspaces[i][1], 
                          id: workspaces[i][0], 
                          count: workspaces[i][4]});
        }

        self.ws_list = ws_list;
    });

    // initial fetch of ws object list
    this.getObjs = $http.rpc('ws', 'list_objects', {workspaces: [self.current_ws] } )
    .then(function(data){
        self.ws_objects = data;

        var types = {};
        for (var i in data) {
            var type = data[i][2].split('-')[0];
            var obj = {name: data[i][1], id: data[i][0]};

            if (type in types) {
                types[type].push(obj);
            } else {
                types[type] = [obj];
            }
        }

        self.wsObjsByType = types;
    }).catch(function(e){
        console.log('here', e)
    });

    
    // method to update ws object list
    this.updateWSObjs = function(new_ws) {
        var p = $http.rpc('ws', 'list_objects', {workspaces: [new_ws]})
        .then(function(ws_objects) {
            self.ws_objects = ws_objects;
        }, function(e) {
            console.log('fail', e)
        })        
        return p;
    }


}]);

 

