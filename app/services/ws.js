/* 
 * Workspace Model
 *
 *   This is responisble for the workspace related models and state.
 *   Two way binding is used to update the view
 *
*/

angular.module('appTasker')
.service('workspace', ['$http', '$rootScope', 'uiTools', '$log',
    function($http, $rootScope, uiTools, $log) {

    var self = this;

    // model for displayed workspaces
    this.workspaces = [];

    this.getWorkspaces = function() {
        console.log('called get workspaces')
        return $http.rpc('ws', 'list_workspaces', {}).then(function(d) {
            console.log('data', d)

        var d1 = new Date();
        var t1 = d1.getTime();

            var data = [];
            for (var i in d) {
                var ws = d[i];
                data.push( self.wsListToDict(ws) )
            }

            // update ui model
            self.workspaces = data;

                        var d2 = new Date();
                        var t2 = d2.getTime();
                        var diff = (t2 - t1);
                        console.log('finished updating status model', diff+' ms')
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
        console.log('adding',ws, self.wsListToDict(ws) )
        self.workspaces.push(self.wsListToDict(ws))
    }

    this.rmFromModel = function(ws) {
        console.log('workspace to remove from model', ws)
        for (var i in self.workspaces) {
            if (self.workspaces[i].id == ws[0]) {
                console.log('removing ', self.workspaces[i].id, 'with index', i);
                self.workspaces[i].slice(i, 1);
            }
        }

    }    

    this.getDirectory = function(directory) {
        return $http.rpc('ws', 'list_workspace_contents', {directory: directory, includeSubDirectories: true})
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
        console.log('trying to delete workspace', name)
        return $http.rpc('ws', 'delete_workspace', 
                    {workspace: name}).then(function(res) {
                        console.log('deleted workspace', res)
                    })
    }    


    function makeSomeData(name, howmany) {
        for (var i=0; i<howmany; i++) {
            self.saveObject('/public/someworkspace', name+String(i), 'this is just some test data '+i, 'Genome')
        }
    }



    //self.saveObject('/public/someworkspace', directory, 'this is just some test data '+i, 'Genome')

    //makeSomeData('somefile', 7);
    


}]);

 

