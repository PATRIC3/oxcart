/* 
 * Workspace Model
 *
 *   This is responsible for the workspace-related models and state.
 *   Two way binding is used to update the view
 *
*/

angular.module('workspace', ['uiTools'])
.service('workspace', ['$http', 'uiTools', '$log', 'authService',
    function($http, uiTools, $log, auth) {

    var self = this;

    // model for displayed workspaces
    this.workspaces = [];

    this.getMyWorkspaces = function() {
        return $http.rpc('ws', 'list_workspaces', {owner_only: 1, no_public: 1})
            .then(function(d) {

            var data = [];
            for (var i in d) {
                var ws = d[i];
                data.push( self.wsListToDict(ws) )
            }

            // update ui model
            self.workspaces = data;
            return data;
        })
    }

    this.getPublicWorkspaces = function() {
        return $http.rpc('ws', 'list_workspaces', {owned_only: 0})
            .then(function(d) {

            var data = [];
            for (var i in d) {
                var ws = d[i];
                data.push( self.wsListToDict(ws) )
            }

            // update ui model
            self.workspaces = data;
            return data;
        })
    }    

    this.wsListToDict = function(ws) {
        return {id: ws[0],
                name: ws[1],
                owner: ws[2],
                mod_date: ws[3],
                files: ws[4],
                folders: ws[7],
                timestamp: uiTools.getTimestamp(ws[3])
               };
    }

    this.addToModel = function(ws) {
        self.workspaces.push(self.wsListToDict(ws))
    }

    this.rmFromModel = function(ws) {
        for (var i in self.workspaces) {
            if (self.workspaces[i].id == ws[0]) {
                console.log('removing ', self.workspaces[i].id, 'with index', i);
                self.workspaces[i].slice(i, 1);
            }
        }
    }    

    this.getDirectory = function(directory) {
        console.log(directory)
        return $http.rpc('ws', 'list_workspace_contents', {directory: directory})
                    .then(function(d) {
                        var data = [];
                        for (var i in d) {  
                            var ws = d[i];
                            data.push({name: ws[1],
                                       type: ws[2],
                                       mod_date: ws[3],
                                       size: ws[9],                                       
                                       //owner: ws[5],
                                       timestamp: uiTools.getTimestamp(ws[3])
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
                                       timestamp: uiTools.getTimestamp(ws[3])
                                      });
                        }
                        return data;
                    }).catch(function(e) {
                        console.log('list_workspace_contents for folders failed', e, directory)
                    })

    }  
    //this.getFolders('/public/testworkspace');


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
                                       timestamp: uiTools.getTimestamp(ws[3])
                                      });
                        }

                        return data;
                    }).catch(function(e) {
                        console.log('list_workspace_contents for folders failed', e, directory)
                    })

    }      

    this.newWS = function(name) {
        return $http.rpc('ws', 'create_workspace', {workspace: name});
    }

    this.newFolder = function(path, name) {
        console.log('creating directory:', path,name)
        return $http.rpc('ws', 'create_workspace_directory', {directory: path+'/'+name})
    }

    this.saveObject = function(directory, name, data, type) {
        $http.rpc('ws', 'save_objects', {objects: [[directory, name, data, type]]}).then(function(res) {

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
        return $http.rpc('ws', 'delete_workspace', 
                    {workspace: name}).then(function(res) {
                        console.log('deleted workspace', res)
                    })
    }

    this.createNode = function(params) {
        console.log('creating upload node', params)
        return $http.rpc('ws', 'create_upload_node', params).then(function(res) {
                    console.log('response', res)
                    return res;
                });
    }    


    function makeSomeData(name, howmany) {
        for (var i=0; i<howmany; i++) {
            self.saveObject('/'+auth.user+'/new workspace', name+String(i), 'this is just some test data '+i, 'Genome')
        }
    }

    //this.createNode({objects: [['/'+auth.user+'/new workspace', 'newdata', 'String', {description: 'blah blah blah'}]]});
    //self.newWS('/nconrad/test')
    //self.saveObject('/public/newws', directory, 'this is just some test data '+i, 'Genome')
    //makeSomeData('somefile', 7);
    

    //this.getObject('/nconrad/asdf', 'b99.ref.fablah')
}]);

 

