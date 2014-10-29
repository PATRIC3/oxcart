

var app = angular.module('appTasker', 
    ['ui.router', 'json-rpc', 'directives'])
        .config(['$locationProvider', '$stateProvider', '$httpProvider', '$urlRouterProvider',
    function($locationProvider, $stateProvider, $httpProvider, $urlRouterProvider) {

    $locationProvider.html5Mode(false);  

    $stateProvider
        .state('Login', {
            url: "/login",
            templateUrl: 'app/views/login.html',
            controller: 'Login'})
        .state('app', {
            url: "/app-tasker",
            templateUrl: 'app/views/home.html'})        
        .state('app.upload', {
            url: "/upload",
            templateUrl: 'app/views/upload.html',
            controller: 'Upload'})   
        .state('app.tasks', {
            url: "/tasks",
            templateUrl: 'app/views/tasks.html'})
        .state('app.apps', {
            url: "/apps/",
            templateUrl: 'app/views/apps.html'})
        .state('app.id', {
            url: "/apps/:id",
            templateUrl: 'app/views/apps.id.html',
            resolve: {
              'GetObjs': function(appUI){
                return appUI.getObjs;
              }
            },
            controller: 'AppCell',
        })
        .state('app.builder', {
            url: "/builder",
            templateUrl: 'app/views/app-builder.html'})
        .state('app.objects', {
            url: "/objects",
            templateUrl: 'app/views/ws/objtable.html'})      

    $urlRouterProvider.when('', '/app-tasker')
                      .when('/', '/app-tasker')
                      .when('#', '/app-tasker');

}]);


app.run(['$rootScope', '$state', '$stateParams', '$http',
    function ($rootScope, $state, $stateParams, $http) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    function login_cb() {
        window.location.reload();
    }
    function logout_cb() {
        window.location.reload();
    }

    /* auth */
    var login_ele = $('#login');
    login_ele.kbaseLogin({login_callback: login_cb, logout_callback: logout_cb});
    login_ele.css('padding-top', '14px');

    $rootScope.userId = login_ele.kbaseLogin('session').user_id;
    $rootScope.token = login_ele.kbaseLogin('session').token;

    //kb = new KBCacheClient($rootScope.token);

}]);



angular.module('json-rpc', [])
    .config([ "$provide", "$httpProvider",
    function($provide, $httpProvider) {

    /* kbase doesn't allow content-type */
    delete $httpProvider.defaults.headers.post['Content-Type'];

    return $provide.decorator('$http', ['$delegate', "$rootScope", "$q", "config",
        function($delegate, $rootScope, $q, $config) {
            
            $delegate.rpc = function(service, method, parameters){
                var deferred = $q.defer();       

                if (service == 'ws') {
                    var url = $config.services.ws_url;
                    var method = 'Workspace.'+method;
                } else if (service == 'fba') { /* untested */
                    var url = $config.services.fba_url;
                    var method = 'fbaModelServices.'+method;
                }

                var data = {version: "1.1", 
                            method: method,
                            params: [parameters], 
                            id: String(Math.random()).slice(2)};

                var config = angular.extend({'headers': 
                                            {'Authorization': $rootScope.token}}, config);

                $delegate.post(url, data, config)
                         .then(function(response) {
                            // only handle actual data
                            return deferred.resolve(response.data.result[0]);
                         }).catch(function(error) {
                            return deferred.reject(error);
                         })


                return deferred.promise;
            };

            return $delegate;
        }]);
}]);
