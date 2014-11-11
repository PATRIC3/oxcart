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
    ['$scope', '$http', 'shock', 'uiTools',
    function($scope, $http, shock, uiTools) {

    $scope.shock = shock;
    $scope.relativeTime = uiTools.relativeTimeShock;
    $scope.readableSize = uiTools.readableSize;    


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
