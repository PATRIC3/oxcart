/* 
 * App Tasker Model (appUI service)
 *
 *   This is responisble for the state of the app tasker model
 *   Two way binding is used to update the view
 *
*/

angular.module('appTasker')
.service('appUI', ['$http', '$rootScope', '$log', 'uiTools', '$q', 'authService', 
    function($http, $rootScope, $log, uiTools, $q, authService) {

    // if not logged in, don't bother using this
    if (!authService.user) return;

    var self = this;

    // how often to update tasks/status (in ms)
    var polling = false;
    var pollTasksMS = 5000;
    var pollStatusMS = 4000;    
    var taskDispCount = 50; 

    // default workspace; used at the start of the application
    var default_ws = authService.user+":home";

    // models for methods; two for faster retrieval and updating of templates
    this.loadingApps = true;
    this.apps = [];
    this.appDict = {};

    // model for cells displayed (not in use)
    this.cells = [];

    // model for ws objects in 'data' view
    this.current_ws = default_ws;
    this.ws_objects;
    this.wsObjsByType;

    // model for tasks; appears in 'running tasks'
    this.loadingTasks = true;       // models are loading at runtime
    this.tasks = {all: [],
                  queued: [], 
                  in_progress: [], 
                  completed: []};
    this.status = {};


    // add cell to app builder model (not in use)
    this.addCell = function(name) {
        var cell_obj = self.appDict[name];
        self.cells.push(cell_obj);
    }

    // remove cell from app builder model (not in use)
    this.removeCell = function(index) {
        this.cells.splice(index, 1);
    }

    // a task is of the form {name: cell.title, fields: scope.fields}
    this.startApp = function(id, form_params) {
        // make the app appear more responsive
        self.status.queued = self.status.queued + 1;


        var params = [id, form_params, 'my_workspace'];
        $http.rpc('app', 'start_app', params)
             .then(function(resp) {
                console.log('response', resp)
                self.updateStatus();
             })
    }

    // update status (queued, inprogress, completed) counts
    this.updateStatus = function() {
        $http.rpc('app', 'query_task_summary')
            .then(function(res) {
                self.status = {queued: 'queued' in res ? res.queued : 0,
                               inprogress: 'in-progress' in res ? res['in-progress'] : 0,
                               completed: 'completed' in res ? res.completed : 0};
                $log.debug('status', res);
            }).catch(function(e){
                $log.error(e)
            })
    }

    // update model, grouped by status, return promise
    this.updateTasks = function() {
        var d = new Date();
        var t1 = d.getTime();
        $log.debug('updating tasks model');        

        return $http.rpc('app', 'enumerate_tasks', [0, taskDispCount])
                    .then(function(tasks) {
                        $log.debug('tasks', tasks)
                        console.log(tasks)

                        var stash = {all: [],
                                     queued: [], 
                                     in_progress: [], 
                                     completed: []};

                        for (var i in tasks) {
                            var status = tasks[i].status;

                            if (status == 'completed') {
                                stash.completed.push( tasks[i] );
                            } else if (status == 'in-progress')  {
                                stash.in_progress.push( tasks[i] );
                            } else if (status == 'queued') {
                                stash.queued.push( tasks[i] );
                            }
                        }

                        stash.all = tasks;

                        // update model
                        self.tasks = stash;
                        self.loadingTasks = false;

                        // performance logging
                        var d = new Date();
                        var t2 = d.getTime();
                        var diff = (t2 - t1);
                        $log.debug('finished updating status model', diff+' ms')

                     }).catch(function(e){
                        $log.error(e)
                     })
    }


    // method for auto-updating models
    // IMPROVEMENT: it would be great to a see a long-polling delta method here
    this.autoUpdateTasks = function() {
        console.log('updating tasks model every '+pollTasksMS+ ' ms...');
        setInterval(self.updateTasks, pollTasksMS);
    }

    this.autoUpdateStatus = function() {
        console.log('updating status model every '+pollStatusMS+ ' ms...');
        setInterval(self.updateStatus, pollStatusMS);
    }    

    // run auto updater on load
    this.updateTasks();    
    this.updateStatus();    

    if (polling) {
        this.autoUpdateTasks();
        this.autoUpdateStatus();    
    }

    // used in 'Run Apps' pages
    this.getApps = $http.rpc('app', 'enumerate_apps')
         .then(function(apps) {
            console.log('apps', apps)

            self.apps = apps;

            var appDict = {}
            for (var i=0; i<apps.length; i++) {
                appDict[apps[i].id] = apps[i];
            }

            self.appDict = appDict;

            self.appTable = getColumns(self.apps, 2);
            self.loadingApps = false;
        }).catch(function(e){
            console.log(e)
        })


    // takes array and divides it into columns of arbitrary 'size'
    function getColumns(list, size) {
        var col_length = Math.ceil(list.length / size);

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

    
    // method to update ws object list, called on change
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

 

