/*
 * Workspace Model
 *
 *   This is responsible for the workspace-related models and state.
 *   Two way binding is used to update the view
 *
*/

angular.module('workspace', ['uiTools'])
.service('workspace', ['$http', 'uiTools', '$log', 'authService', 'config',
    function($http, uiTools, $log, auth, config) {

    var self = this;

    // model for displayed workspaces
    this.workspaces = [];

    this.getMyWorkspaces = function() {
        return $http.rpc('ws', 'list_workspaces', {owner_only: 1, no_public: 1})
            .then(function(d) {

            // parse into list of dicts
            var data = [];
            for (var i in d)
                data.push( self.wsListToDict(d[i]) );

            // update ui model
            self.workspaces = data;

            return data;
        })
    }

    this.getPublicWorkspaces = function() {
        return $http.rpc('ws', 'list_workspaces', {owned_only: 0})
            .then(function(d) {

            // parse into list of dicts
            var data = [];
            for (var i in d)
                data.push( self.wsListToDict(d[i]) );

            // update ui model
            self.workspaces = data;
            return data;
        })
    }

    this.wsListToDict = function(ws) {
        // takes workspace info array, returns dict.
        return {id: ws[0],
                name: ws[1],
                owner: ws[2],
                mod_date: ws[3],
                files: ws[4],
                folders: ws[7],
                timestamp: Date.parse(ws[3])
               };
    }

    this.addToModel = function(ws) {
        self.workspaces.push( self.wsListToDict(ws) );
    }

    this.rmFromModel = function(ws) {
        for (var i=0; i<self.workspaces.length; i++) {
            console.log(self.workspaces[i].id, ws[0])

            if (self.workspaces[i].id == ws[0])
                self.workspaces.splice(i, 1);
        }

        console.log('new model', self.workspaces);
    }

    this.getDirectory = function(directory) {
        console.log(directory)
        return $http.rpc('ws', 'list_workspace_contents', {directory: directory, includeSubDirectories:1})
                    .then(function(d) {
                        var data = [];
                        for (var i in d) {
                            var ws = d[i];
                            data.push({name: ws[1],
                                       type: ws[2],
                                       mod_date: ws[3],
                                       size: ws[9],
                                       //owner: ws[5],
                                       timestamp: Date.parse(ws[3])
                                      });
                        }

                        return data;
                    }).catch(function(e) {
                        console.log('list_workspace_contents failed', e, directory)
                    })
    }

    this.getFolders = function(directory) {
        return $http.rpc('ws', 'list_workspace_contents', {directory: directory, excludeObjects: 1})
                    .then(function(d) {
                        var data = [];
                        for (var i in d) {
                            var ws = d[i];
                            data.push({name: ws[1],
                                       type: ws[2],
                                       mod_date: ws[3],
                                       size: ws[9],
                                       //owner: ws[5],
                                       timestamp: Date.parse(ws[3])
                                      });
                        }

                        return data;
                    }).catch(function(e) {
                        console.log('list_workspace_contents for folders failed', e, directory)
                    })

    }


    this.getObjs = function(directory) {
        return $http.rpc('ws', 'list_workspace_contents', {directory: directory, includeSubDirectories: 0})
                    .then(function(d) {
                        var data = [];
                        for (var i in d) {
                            var ws = d[i];
                            data.push({name: ws[1],
                                       type: ws[2],
                                       mod_date: ws[3],
                                       size: ws[9],
                                       //owner: ws[5],
                                       timestamp: Date.parse(ws[3])
                                      });
                        }

                        return data;
                    }).catch(function(e) {
                        console.log('list_workspace_contents for folders failed', e, directory)
                    })

    }

    this.newWS = function(name) {
        console.log('called new workspace with name:', name)
        return $http.rpc('ws', 'create_workspace', {workspace: name});
    }

    this.newFolder = function(path, name) {
        var params = {directory: path+'/'+name}
        console.log('creating folder with params', params)
        return $http.rpc('ws', 'create_workspace_directory', params)
    }

    this.saveObject = function(directory, name, data, type) {
        return $http.rpc('ws', 'save_objects', {objects: [[directory, name, data, type]]}).then(function(res) {
            console.log('response', res)
            return res;
        })
    }

    this.getObject = function(directory, name) {
        console.log('getting object', directory, name);
        return $http.rpc('ws', 'get_objects', {objects: [[directory, name]]} ).then(function(res) {
                    console.log('data download', res);
                })
    }

    this.mv = function(path, name, des_path, des_name) {
        console.log('move', path, name, des_path, des_name)
        return $http.rpc('ws', 'move_objects',
                    {objects: [[path, name, des_path, des_name]] }).then(function(res) {
                        console.log('res', res);
               })
    }

    this.deleteFolder = function(path, name) {
        console.log('attempting to delete folder', path, name)
        return $http.rpc('ws', 'delete_workspace_directory',
                    {directory: path+'/'+name, force: 1}).then(function(res) {
                        console.log('deleted directory', res)
                    })
    }

    this.deleteObj = function(path, name) {
        return $http.rpc('ws', 'delete_objects',
                    {objects: [[path, name]]}).then(function(res) {
                        console.log('deleted object', res)
                    })
    }

    this.deleteWS = function(name) {
        return $http.rpc('ws', 'delete_workspace', {workspace: name})
                    .then(function(res) {
                        console.log('deleted workspace', res)
                        return res;
                    })
    }

    this.createNode = function(params) {
        console.log('creating upload node', params)
        return $http.rpc('ws', 'create_upload_node', params).then(function(res) {
                    console.log('response', res)
                    return res;
                });
    }


    // views wait on this request
    this.getWS = this.getMyWorkspaces();


    //
    // some code for testing
    //
    function makeSomeData(name, howmany) {
        var folder = "new folder";

        self.newWS(folder).then(function(res) {
            console.log(res)
            for (var i=0; i<howmany; i++) {
                self.saveObject(path+'/'+folder, name+String(i), 'this is just some test data '+i, 'Genome')
            }
        })
    }

    function makeSomeFolders(folder ,name, howmany) {
        var path = '/'+auth.user+'/'+folder;

        for (var i=0; i<howmany; i++) {
            self.newFolder(path, name+String(i));
        }
    }

    //makeSomeData('somefile', 20);
    //makeSomeFolders('new folder', 'folder ', 20);
    //this.getObject('/nconrad/new folder', 'test14.fa')

}]);



