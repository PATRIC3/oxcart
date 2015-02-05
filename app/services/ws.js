/*
 * Workspace Model
 *
 *   This is responsible for the workspace-related models and state.
 *   Two way binding is used to update the view
 *
*/

angular.module('workspace', [])
.service('workspace', ['$http', '$log', 'authService', 'config', '$cacheFactory', '$q',
    function($http, $log, auth, config, $cacheFactory, $q) {

    var self = this;

    // model for displayed workspaces
    this.workspaces = [];
    var cache = $cacheFactory('wsCache');

    this.getMyData = function(path, opts) {
        var params = {paths: [path]};
        angular.extend(params, opts);

        //ar data = cache.get(path);

        return $http.rpc('ws', 'ls', params)
                    .then(function(d) {
                        var d = d[path];

                        // parse into list of dicts
                        var data = [];
                        for (var i=0; i<d.length; i++)
                            data.push( self.wsListToDict(d[i]) );

                        cache.put(path, data);
                        return data;
                    })
    }

    this.wsListToDict = function(ws) {
        // takes workspace info array, returns dict.
        return {name: ws[0],
                type: ws[1],
                path: ws[2],
                mod_date: ws[3],
                id: ws[4],
                owner: ws[5],
                files: ws[6],
                folders: ws[7],
                timestamp: Date.parse(ws[3])
               };
    }

    this.addToModel = function(ws) {
        self.workspaces.push( self.wsListToDict(ws) );
    }


    this.rmFromModel = function(ws) {
        for (var i=0; i<self.workspaces.length; i++) {
            console.log(self.workspaces[i].id, ws[4])

            if (self.workspaces[i].id == ws[4])
                self.workspaces.splice(i, 1);
        }
    }

    // takes source and destimation paths, moves object
    this.mv = function(src, dest) {
        return $http.rpc('ws', 'copy', {objects: [[src, dest]], move: 1 })
                    .then(function(res) {
                        return res;
                    })
    }

    // takes path of object, deletes object
    this.deleteObj = function(path) {
        console.log('calling delete')
        return $http.rpc('ws', 'delete',
                    {objects: [path]}).then(function(res) {
                        console.log('deleted object', res)
                        return res;
                    }).catch(function(e) {
                        console.error('delete failed', e, path)
                    })

    }

    // takes workspace spec hash, creates node.  fixme: cleanup
    this.createNode = function(params) {
        console.log('creating upload node', params)
        return $http.rpc('ws', 'create', params).then(function(res) {
                    console.log('response', res)
                    return res;
                })
    }

    // takes path of new folder, creates it
    this.createFolder = function(path) {
        var params = {objects: [[path, 'Directory']]};
        return $http.rpc('ws', 'create', params).then(function(res) {
                    console.log('response', res)
                    return res;
                }).catch(function(e){
                    console.error('Could not create folder', path, e.data.error)
                })
    }

    // views wait on this request
    this.getWS = this.getMyData('/'+auth.user)
                     .then(function(data) {
                        console.log('setting workspaces', data)
                         self.workspaces = data;
                    })


}]);



