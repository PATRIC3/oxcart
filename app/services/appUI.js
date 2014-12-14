/* 
 * App Tasker Model (appUI service)
 *
 *   This is responisble for the state of the app tasker model
 *   Two way binding is used to update the view
 *
*/

angular.module('appUI', ['uiTools', 'kbase-auth'])
.service('appUI', ['$http', '$log', 'uiTools', 'authService', 'workspace', 
    function($http, $log, uiTools, authService, ws) {

    // if not logged in, don't bother using this
    if (!authService.user) return;

    var self = this;

    // how often to update tasks/status (in ms)
    var polling = true;
    var pollTasksMS = 5000;
    var pollStatusMS = 3000;    
    var taskDispCount = 50; 

    // default workspace; used at the start of the application
    var default_ws = 'Default folder goes here';

    // models for methods; two for faster retrieval and updating of templates
    this.loadingApps = true;
    this.apps = [];
    this.appDict = {};
    this.appList = []; // used for dropdowns

    // model for cells displayed (not in use)
    this.cells = [];

    // model for ws objects in 'data' view
    this.current_ws = default_ws;
    this.wsObjects;
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
    this.startApp = function(id, form_params, workspace) {
        // make the app appear more responsive
        self.status.queued = self.status.queued + 1;

        // FIX: refactor, deal with workspace / directory issue on front-end and back
        // iterate through ids, if type is 'wstype', add on workspace path
        for (var i in self.appDict[id].parameters) {
            var param = self.appDict[id].parameters[i];

            for (var key in form_params) {
                if (param.id == key && (param.type == 'wstype' || param.type == 'wsid') )  {
                    form_params[key] = '/'+authService.user+'/'+
                             workspace+'/'+form_params[key];
                }             
            }
        }

        var ws = '/'+authService.user+'/'+workspace

        var params = [id, form_params, ws];

        console.log('form_params', params)        
        $http.rpc('app', 'start_app', params)
             .then(function(resp) {
                console.log('app service response', resp)
                self.updateStatus();
             })
    }

    // update status (queued, inprogress, completed) counts
    this.updateStatus = function() {
        return $http.rpc('app', 'query_task_summary')
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

            self.apps = apps;

            var appDict = {};
            var appList = [];
            for (var i=0; i<apps.length; i++) {
                appDict[apps[i].id] = apps[i];
                appList.push({id: apps[i].id, name: apps[i].label})
            }

            self.appDict = appDict;
            self.appList = appList;

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


    this.updateWSObjs = function(workspace) {
        return ws.getObjs(workspace).then(function(objs){

                    var objs = objs.sort(compare)

                    function compare(a,b) {
                        var t1 = b.timestamp
                        var t2 = a.timestamp
                        if (t1 < t2) return -1;
                        if (t1 > t2) return 1;
                        return 0;
                    }

                    self.wsObjects = objs;

                    objsByType = {};
                    for (var i=0; i < objs.length; i++) {
                        var obj = objs[i];
                        var type = obj.type;

                        if (type in objsByType) objsByType[type].push(obj);
                        else {
                            objsByType[type] = [];
                            objsByType[type].push(obj);
                        }
                    }

                    // update model
                    self.wsObjsByType = objsByType;
                    return objsByType;
                })
    }


}]);

 

