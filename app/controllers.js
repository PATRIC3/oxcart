/*  
 *  Controllers
 *  See: https://docs.angularjs.org/guide/controller
 *
 *  Analysis - State goes across upload, data, apps, and tasks, using the service
 *             appUI
 *  
*/

angular.module('appTasker')
.controller('Analysis', 
['$scope', '$state', 'appUI', 'authService', '$window',
function($scope, $state, appUI, authService, $window) {

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

}])

.controller('Upload', 
    ['$scope', '$http', '$rootScope', 'config',
    function($scope, $http, $rootScope, config) {

    $scope.shockURL = config.services.shock_url;
    console.log($scope.shockURL)
    var url = $scope.shockURL+'/node';
    var auth = {Authorization: 'OAuth ' + $rootScope.token};
    var config = {headers:  auth }

    // use angular http
    $scope.uploadFile = function(files) {

        $scope.$apply( function() {
            $scope.uploadingCount = 1;
            $scope.uploadComplete = false;
        })

        var form = new FormData($('#upload-form')[0]);
        $.ajax({
            url: url,
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
        $http.get(url+'?querynode&owner='+$rootScope.user+'&limit=10000', config)
            .success(function(data) {
                $scope.uploads = data;
                console.log('uploaded data', data)
            }).error(function(e){
                console.log('fail', e)
            })
    }

    // get upload list on load
    $scope.getUploads();
}])

.controller('AppCell', 
    ['$scope', '$stateParams', 'appUI',
    function($scope, $stateParams, appUI) {
    // service for appUI state
    $scope.appUI = appUI;

    $scope.app = appUI.appDict[$stateParams.id];

    //if ($stateParams.id) {
    //    appUI.setApp($stateParams.id);
    //}

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
