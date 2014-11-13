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

    // service for appUI state
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

    /*
    var auth = {token: authService.token}
    var appService = new AppService(config.services.app_url, auth)

    appService.enumerate_tasks(0, 25).done(function(data){
        console.log('app', data)
    }).fail(function(e){
        console.log('failed', e)
    })*/

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
        $scope.relativeTime = uiTools.relativeTimeShock;
        $scope.readableSize = uiTools.readableSize;
}])


.controller('AppCell', 
    ['$scope', '$stateParams', 'appUI',
    function($scope, $stateParams, appUI) {
    // service for appUI state
    $scope.appUI = appUI;

    // set 'app' as app (via URL)
    $scope.app = appUI.appDict[$stateParams.id];


    $scope.fields = {};

    $scope.runCell = function(index, app) {
        console.log('heres the app', app)

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
.controller('LeftCtrl', ['$scope', '$timeout', '$mdSidenav',
    function($scope, $timeout, $mdSidenav) {
  $scope.close = function() {
    $mdSidenav('left').close();
  };
}])
