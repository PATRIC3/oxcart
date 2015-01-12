/*
 *  Controllers
 *  See: https://docs.angularjs.org/guide/controller
 *
 *  Analysis - State goes across upload, data, apps, and tasks, using the service
 *             appUI
 *
*/

angular.module('controllers', [])
.controller('MainCtrl',
['$scope', '$state', 'appUI', 'authService', '$window', 'workspace',
function($scope, $state, appUI, auth, $window, ws) {

    $scope.myDataPath = '/'+auth.user;

    // app and ws services
    $scope.appUI = appUI;

    $scope.logout = function() {
        authService.logout();
        $state.transitionTo('login', {}, { reload: true, inherit: true, notify: false })
              .then(function() {
                  $window.location.reload();
              });
    }
}])


.controller('WS',
    ['$scope', '$stateParams', 'workspace', '$log',
     'uiTools', '$document', '$timeout', '$mdDialog', 'authService', 'appUI',
    function($scope, $stateParams, ws, $log, uiTools, $document, $timeout,  $mdDialog, auth, appUI) {

    $scope.appUI = appUI;

    $scope.ws = ws;

    $scope.uiTools = uiTools;
    $scope.relativeTime = uiTools.relativeTime;
    $scope.readableSize = uiTools.readableSize;

    // sort by time first
    $scope.predicate = 'timestamp';
    $scope.reverse = true;

    // model: row selection data
    $scope.selected;

    // model: when in edit mode
    $scope.edit = false;

    // model: primary click on row
    $scope.select = false;

    // model: items in folder that is being viewed
    $scope.items;


    // If there is a path in the url, use it.
    // Otherwise, use "/username"
    if ($stateParams.dir)
        $scope.folder = $stateParams.dir;
    else
        $scope.folder = '/'+auth.user;

    // get path in list form
    var depth = $scope.folder.split('/').length -2;
    $scope.path = $scope.folder.split('/').splice(2, depth);

    // get path strings for parent folders
    var dir_names = $scope.folder.split('/').splice(1, depth);
    var links = [];
    for (var i=0; i < depth; i++) {
        var link = '/'+dir_names.join('/');
        links.push(link);
        dir_names.pop();
    }
    links.reverse();
    links = links.slice(1, links.length);


    // load data
    $scope.loading = true;
    ws.getMyData($scope.folder).then(function(data) {
        $scope.items = data;

        $scope.loading = false;
    })

    // method for retrieving links of all parent folders
    $scope.getLink = function(i) {
        return links[i];
    }

    $scope.prevent = function(e) {
        e.stopPropagation();
    }

    // context menu open
    $scope.openMenu = function(e, i, item) {
        console.log('called open row', e, i, item)
        $scope.selected = {type: item.type ? item.type : 'Workspace',
                           name: item.name,
                           index: i};
        console.log('selected item is ', $scope.selected)
    }

    // context menu close
    $scope.closeMenu = function(e, i, item) {
        console.log('called close')
        // if not editing something, remove selection
        if (!$scope.edit) {
            $scope.selected = undefined;
        }
    }

    // used for creating new folder, maybe other things later
    $scope.newPlaceholder = function() {
        console.log('creating new place holder')
        $scope.placeHolder = true;
        $timeout(function() {
            $scope.$broadcast('placeholderAdded');
        })
    }

    // saves the folder name, updates view
    $scope.createFolder = function(name) {
        console.log('creating folder', path(name))
        $scope.placeHolder = false;

        // if nothing entered, return
        if (!name) return;

        $scope.saving = true;
        return ws.createFolder( path(name) ).then(function() {
                   $scope.saving = false;
                   $scope.updateDir();
               }).catch(function(e){
                    console.log('there was an error', e)
                    $scope.saving = false;
               })
    }

    // delete an object
    $scope.deleteObj = function(name) {
        ws.deleteObj( path(name) ).then(function(res) {
            ws.rmFromModel(res[0]);
            $scope.updateDir();
        })
    }

    // used to create editable name
    $scope.editableName = function(selected) {
        $scope.edit = {index: selected.index};

        $timeout(function() {
            $scope.$broadcast('editable');
        })
    }

    // used for rename and move, update view
    $scope.mv = function(src, dest) {
        $scope.selected = undefined;

        $scope.saving = true;
        ws.mv(src, dest).then(function( ){
            $scope.saving = false;
            $scope.edit = false;
            $scope.updateDir();
        }).catch(function(e) {
            console.error('could not save', e)
            $scope.saving = false;
            $scope.edit = false;
        });
    }

    // used for rename and move, update view
    $scope.rename = function(name, new_name) {
        $scope.selected = undefined;

        $scope.saving = true;
        $scope.mv( path(name), path(new_name) );
    }




    $scope.selectRow = function(e, i, item) {
        console.log('called select row', e, i, item)
        $scope.select = true;
        $scope.selected = {type: item.type ? item.type : 'Workspace',
                           name: item.name,
                           index: i};

        e.stopPropagation();
        e.preventDefault();

        // let template update
        $timeout(function() {
            $document.bind('click', events);
        })

        // don't interfere with context menu
        function events() {
            $scope.$apply(function() {
                $scope.select = false;
                $scope.selected = undefined;
            })
            $document.unbind('click', events);
        }
    }

    // updates the view
    $scope.updateDir = function() {
        ws.getMyData($scope.folder).then(function(data) {
            $scope.items = data;
        })
    }

    // updates the view
    $scope.updateWorkspaces = function() {
        ws.getWorkspaces().then(function(d) {
            $scope.workspaces = d;
            $scope.loading = false;
        })
    }

    function path(name) {
        return $scope.folder+'/'+name;
    }


}])



.controller('Upload',
    ['$scope', '$http', 'uiTools', 'config', 'authService',
    function($scope, $http, uiTools, config, authService) {

    var shockURL = config.services.shock_url;
    var nodeURL= shockURL+'/node';
    var auth = {Authorization: 'OAuth ' + authService.token};
    var header = {headers:  auth }

    $scope.uploadFile = function(files) {

        $scope.$apply( function() {
            $scope.uploadingCount = 1;
            $scope.uploadComplete = false;
        })

        var form = new FormData($('#upload-form')[0]);
        $.ajax({
            url: nodeURL,
            type: 'POST',
            xhr: function() {
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){
                    myXhr.upload.addEventListener('progress', updateProgress, false);
                }
                return myXhr;
            },
            headers: auth,
            success: function(data) {
                console.log('upload success', data)
                $scope.$apply(function() {
                    $scope.uploadingCount = 0;
                    $scope.uploadProgress = 0;
                    $scope.uploadComplete = true;
                })
            },
            error: function(e){
                console.log('failed upload', e)
            },
            data: form,
            contentType: false,
            processData: false
        });

        function updateProgress (oEvent) {
            if (oEvent.lengthComputable) {
                var percent = oEvent.loaded / files[0].size;
                $scope.$apply(function() {
                    $scope.uploadProgress = Math.floor(percent*100);
                })
            }
        }
    }

    $scope.getUploads = function() {
        $http.get(nodeURL+'?querynode&owner='+authService.user+'&limit=10000', header)
            .success(function(data) {
                $scope.uploads = data;
                $scope.uploadCount = data.total_count;
                $scope.loading = false;
            }).error(function(e){
                console.log('fail', e)
            })
    }

    //$scope.shock = shock;
    $scope.loading = true;
    $scope.getUploads();

    $scope.nodeURL = nodeURL;
    $scope.relativeTime = uiTools.relativeTime;
    $scope.readableSize = uiTools.readableSize;
}])

// controller for Task Status view
.controller('TaskStatus',
    ['$scope', '$stateParams', 'uiTools',
    function($scope, $stateParams, uiTools) {

        $scope.shortID = function(id) {
            return id.split('-')[0]+'...';
        };

        $scope.relativeTime = function(iso) {
            return uiTools.relativeTime(Date.parse(iso));
        }
        $scope.readableSize = uiTools.readableSize;
}])

// Controller for container of app form
.controller('AppCell',
    ['$scope', '$stateParams', 'appUI', 'workspace',
    '$timeout', 'upload', '$http', 'authService', '$mdDialog',
    function($scope, $stateParams, appUI, ws, $timeout, upload, $http, auth, $dialog) {
    var $self = $scope;

    // service for appUI state
    $scope.appUI = appUI;



    if (ws.workspaces.length) {
        $scope.workspaces = ws.workspaces;
        $scope.selectedWS = ws.workspaces[0].name;
        updateObjDD($scope.selectedWS);
    }

    // update workspace objects if dropdown changes
    // $scope.$watch('ddDisplayed', function(new_ws) {
    $scope.$on('wsChange', function(event, new_ws) {
        if (new_ws) updateObjDD(new_ws);
        $scope.selectedWS = new_ws
    })

    function updateObjDD(ws_name) {
        appUI.updateWSObjs( path(ws_name) ).then(function(objs) {
            if ('string' in objs)
                $scope.selectedObj = objs['string'][0].name;
            else
                $scope.selectedObj = false;
        })
    }

    // saves the folder; fixme: make this a util
    $scope.createFolder = function(name) {
        $scope.placeHolder = false;

        // if nothing entered, return
        if (!name) return;

        $scope.saving = true;
        return ws.createFolder( path(name) ).then(function(res) {
                  $scope.saving = false;
                  ws.addToModel(res[0]);
                  $scope.workspaces = ws.workspaces;
                  $scope.selectedWS = ws.workspaces[0].name;

                  updateObjDD($scope.selectedWS);
               }).catch(function(e){
                    console.error('error creating folder', e)
                    $scope.saving = false;
               })
    }

    // set 'app' as app (via URL)
    if ($stateParams.file)
        $http.get('./tests/test-forms/'+$stateParams.file+'.json')
             .then(function(res) {
                $scope.app =  res.data;
             });
    else
        $scope.app = appUI.appDict[$stateParams.id];


    $scope.fields = {};

    $scope.runCell = function(index, app) {
        $scope.run = true;
        $scope.appRunning = true;

        console.log('the fields', $scope.fields)

        if ($stateParams.file)
            appUI.startAppTest(app.id, $scope.fields, $scope.selectedWS, $scope.app)
                 .then(function(res) {
                    $scope.output = res
                    console.log('output', $scope.output)
                 })
        else
            appUI.startApp(app.id, $scope.fields, $scope.selectedWS)
                 .then(function(res) {
                    $scope.output = res
                    console.log('output', $scope.output)
                 })
    }


    $scope.getDefault = function(type) {
        return appUI.wsObjsByType[type][0].name
    }

    $scope.upload = upload;

    $scope.createNode = function(files, overwrite) {
        upload.createNode('/'+auth.user+'/'+$scope.selectedWS, files, overwrite)
              .catch(function(e){
                  if (e.data.error.code == -32603) {
                      $dialog.show({
                          templateUrl: 'app/views/ws/confirm.html',
                          onComplete: function() {

                          },
                          controller: ['$scope', function($scope) {
                              $scope.cancel = function(){
                                  $dialog.hide();
                              }
                              $scope.overwrite = function(name){
                                  $self.createNode(files, true);
                                  $dialog.hide();
                              }
                              $scope.keep = function(name){
                                  $self.createNode(files, true);
                                  $dialog.hide();
                              }
                          }]
                      })
                  } else {
                      alert('Server error! Could not upload node.')
                  }

              })
    }

    $scope.openBrowser = function() {
        $dialog.show({
            templateUrl: 'app/views/ws/mini-browser.html',
            onComplete: function() {

            },
            controller: ['$scope', function($scope) {
                $scope.cancel = function(){
                    $dialog.hide();
                }
                $scope.overwrite = function(name){
                    $self.createNode(files, true);
                    $dialog.hide();
                }
                $scope.keep = function(name){
                    $self.createNode(files, true);
                    $dialog.hide();
                }
            }]
        })
    }




    // update dropdown after upload
    $scope.$watch('upload.status', function(value) {
        if (value.complete == true) {
            updateObjDD($scope.selectedWS);

            // clear uploader; fix
            document.getElementById('upload-form').innerHTML =
            document.getElementById('upload-form').innerHTML;

            $timeout(function() {
                $scope.status.complete = false;
            }, 2000)
        }

        $scope.status = value;

    }, true);

    function path(name) {
        return '/'+$scope.user+'/'+name;
    }

}])

.controller('Apps', ['$scope', 'appUI', function($scope, appUI) {

}])

.controller('Proto',
    ['$scope', 'workspace', 'authService',
    function($scope, ws, auth) {

        // top level of tree
        ws.getMyData('/'+auth.user).then(function(data) {
            $scope.tree = data;
        })

        $scope.getFolder = function(path) {
            console.log('getting data!', path)
            return ws.getMyData('/'+auth.user+'/'+path).then(function(data) {
                return data;
            })
        }

    }
])


//  controller. that's it.
.controller('Login', ['$scope', '$state', 'authService', '$window',
    function($scope, $state, authService, $window) {

    $scope.loginUser = function(user, pass) {
        $scope.loading = true;
        authService.login(user, pass)
            .success(function(data) {

                // see https://github.com/angular-ui/ui-router/issues/582
                $state.transitionTo('app.apps', {}, {reload: true, inherit: true, notify: false})
                      .then(function() {
                        setTimeout(function(){
                            $window.location.reload();
                        }, 0);
                      });

            }).error(function(e, status){
                console.log('error', e)
                $scope.loading = false;
                if (status == 401) {
                    $scope.inValid = true;
                } else {
                    $scope.failMsg = "Could not reach authentication service: "+e.error_msg;
                }

            })
    }
}])

.controller('UploadCtrl',
    ['$scope', 'upload', 'appUI', function($scope, upload, appUI) {



}])


.controller('DDFilter', ['$scope', function($scope) {



}])