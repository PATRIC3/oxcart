/*  
 *  Controllers
 *  See: https://docs.angularjs.org/guide/controller
 *
 *  Analysis - State goes across upload, data, apps, and tasks, using the service
 *             appUI
 *  
*/

angular.module('appTasker')
.controller('MainCtrl', 
['$scope', '$state', 'appUI', 'authService', '$window', 'config',
function($scope, $state, appUI, authService, $window, config) {

    // app and ws services
    $scope.appUI = appUI;   


    // selected workpsace
    $scope.selectedWS = appUI.current_ws;

    // update workspace objects if dropdown changes
    //$scope.$watch('ddDisplayed', function(new_ws) {
    $scope.$on('ddChange', function(event, new_ws) {
        if (new_ws) {
            appUI.updateWSObjs(new_ws);
        }
    })

    $scope.logout = function() {
        authService.logout();
        $state.transitionTo('login', {}, { reload: true, inherit: true, notify: false })
              .then(function() {
                  $window.location.reload();
              });
    }


}])


.controller('WS', 
    ['$scope', '$stateParams', 'workspace', 'uiTools', '$document', '$timeout', '$mdDialog',
    function($scope, $stateParams, ws, uiTools, $document, $timeout,  $mdDialog) {

    $scope.ws = ws;

    $scope.uiTools = uiTools;
    $scope.relativeTime = uiTools.relativeTimeShock;
    $scope.readableSize = uiTools.readableSize;

    // let's sort by time first
    $scope.predicate = 'timestamp';
    $scope.reverse = true;

    // model for row selection data
    $scope.selected;

    // model for when in edit mode
    $scope.edit = false;

    // model for primary click on row
    $scope.select = false;

    // load main workspace page
    $scope.loading = true;

    // if navigating directories, get the data
    if ($stateParams.dir) {
        $scope.directory = $stateParams.dir;

        // get path in list form
        var depth = $scope.directory.split('/').length -2
        $scope.path = $scope.directory.split('/').splice(2, depth)

        // get path strings for parent directories
        var dir_names = $scope.directory.split('/').splice(1, depth)
        var links = [];
        for (var i=0; i < depth; i++) {
            var link = '/'+dir_names.join('/');
            links.push(link);
            dir_names.pop();
        }
        links.reverse();
        links = links.slice(1, links.length);

        // model for data to be displayed
        $scope.dirData = [];

        $scope.loading = true;
        ws.getDirectory($scope.directory).then(function(data) {
            $scope.dirData = data;
            $scope.loading = false;
        })

        $scope.getLink = function(i) {
            return links[i];
        }
    } else {
        ws.getWorkspaces().then(function(d) {
            $scope.workspaces = d;
            $scope.loading = false;
        })
    }
    
    $scope.prevent = function(e) {
        e.stopPropagation();
    }

    // context menu open
    $scope.openMenu = function(e, i, item) {
        $scope.selected = {type: item.type ? item.type : 'Workspace', 
                           name: item.name,
                           index: i};
                           console.log($scope.selected)
    }

    // context menu close
    $scope.closeMenu = function(e, i, item) {
        // if not editing something, remove selection
        if (!$scope.edit) {
            $scope.selected = undefined;
        }
    }

    // new workspace creation
    $scope.newWSModal = function(ev, path) {
        $mdDialog.show({
            templateUrl: 'app/views/ws/new-ws.html',
            onComplete: function() {
                console.log('here')
                $scope.$broadcast('editable');
            },
            controller: function($scope, foo) {
                $scope.cancel = function(){
                    $mdDialog.hide();
                }
                $scope.save = function(name){
                    newWS(name);
                    $mdDialog.hide();
                }
            },
            locals: {foo: 1},
        });
    }    

    function newWS(name) {
        ws.newWS(name).then(function() {
            $scope.updateWorkspaces();
        })
    }

    // used for creating new folder, maybe other things later
    $scope.newPlaceholder = function() {
        $scope.newFolder = true;
        $timeout(function() {
            $scope.$broadcast('placeholderAdded');
        })
    }

    // saves the folder name, updates view
    $scope.saveFolder = function(path, name) {
        $scope.newFolder = false;
        $scope.saving = true;
        ws.newFolder(path, name).then(function() {
            $scope.saving = false;
            $scope.updateDir();
        })
    }

    // delete an object
    $scope.deleteObj = function(path, name) {
        ws.deleteObj(path,name).then(function() {
            $scope.updateDir();
        })
    }

    // delete an workspace
    $scope.deleteWS = function(name) {
        $scope.deleting = true;
        ws.deleteWS(name).then(function() {
            $scope.updateWorkspaces();
        })
    }

    // used to create editable name
    $scope.editableName = function(path, selected) {
        console.log(selected.index)
        $scope.edit = {index: selected.index};
        console.log($scope.edit.index)

        $timeout(function() {
            $scope.$broadcast('editable');
        })
    }

    // used for rename and move, update view
    $scope.mv = function(path, name, new_path, new_name) {
        console.log('calling mv ', path, name, new_path, new_name)
        $scope.selected = undefined;

        $scope.saving = true;
        ws.mv(path, name, new_path, new_name).then(function( ){
            $scope.saving = false;            
            $scope.edit = false;
            $scope.updateDir();
        }).error(function(e) {
            console.log('could not save', e)
            $scope.saving = false;
            $scope.edit = false;
        });

    }


    $scope.selectRow = function(e, i, item) {
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
        ws.getDirectory($scope.directory).then(function(data) {
            $scope.dirData = data;            
        })
    }

    // updates the view
    $scope.updateWorkspaces = function() {
        ws.getWorkspaces().then(function(d) {
            $scope.workspaces = d;
            $scope.loading = false;
        })
    }


}])


.controller('Upload', 
    ['$scope', '$http', 'shock', 'uiTools', 'config', 'authService',
    function($scope, $http, shock, uiTools, config, authService) {

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
                    $scope.getUploads(); 
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
    $scope.relativeTime = uiTools.relativeTimeShock;
    $scope.readableSize = uiTools.readableSize;
}])

// controller for Task Status view
.controller('TaskStatus', 
    ['$scope', '$stateParams', 'uiTools',
    function($scope, $stateParams, uiTools) {

        $scope.shortID = function(id) {
            return id.split('-')[0]+'...';
        };

        $scope.relativeTime = uiTools.relativeTimeShock;
        $scope.readableSize = uiTools.readableSize;
}])

// Controller for container of app form
.controller('AppCell', 
    ['$scope', '$stateParams', 'appUI',
    function($scope, $stateParams, appUI) {
    // service for appUI state
    $scope.appUI = appUI;

    // set 'app' as app (via URL)
    $scope.app = appUI.appDict[$stateParams.id];


    $scope.fields = {};

    $scope.runCell = function(index, app) {
        for (var i in app.parameters) {
            var param = app.parameters[i];

        }
        appUI.startApp(app.id, $scope.fields);
    }


    $scope.getDefault = function(type) {
        return appUI.wsObjsByType[type][0].name
    }

}])

.controller('Apps', ['$scope', 'appUI', function($scope, appUI) {

}])

// login controller. that's it.
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
                $scope.loading = false;
                if (status == 401) {
                    $scope.inValid = true;
                } else {
                    $scope.failMsg = "Coud not reach authentication service: "+e.error_msg;
                }

            })
    }

}])





/*
        $scope.gridOptions = {filterOptions: {filterText: '', 
                                              useExternalFilter: false,
                                              showFilter: true},
                              showColumnMenu: true,
                              columnDefs: [{field: "name", displayName: "Name"},
                                           {field: "owner", displayName: "Owner"},
                                           {field: "mode_date", displayName: "Mod Date"},
                                           {field: "objects", displayName: "Objects"},
                                           {field: "directories", displayName: "Directories"}]
                             };      
  
        $scope.gridOptions.minRowsToShow = 1000;

    ws.updateWorkspaces().then(function(d) {

        var data = [];
        for (var i in d) {
            var ws = d[i]
            data.push({name: ws[1],
                       owner: ws[2],
                       mod_date: ws[3],
                       objects: ws[4],
                       directories: ws[5]})  

        }                      

        $scope.gridOptions.onRegisterApi = function (gridApi) {
            $scope.gridApi = gridApi;
        }    


        $scope.gridOptions.data = data;
    })


    // oh, open source https://github.com/angular-ui/ng-grid/issues/1735
    function setHeight(extra) {
      $scope.height = (($scope.gridOptions.data.length * 30) + 30);
      if (extra) {
        $scope.height += extra;
      }
      $scope.api.grid.gridHeight = $scope.height;
    }
  */
