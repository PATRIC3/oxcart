

var app = angular.module('appRunner', 
    ['ui.router', 'json-rpc', 'directives'])
        .config(['$locationProvider', '$stateProvider', '$httpProvider', '$urlRouterProvider',
    function($locationProvider, $stateProvider, $httpProvider, $urlRouterProvider) {

    $locationProvider.html5Mode(false);  

    $stateProvider
        .state('home', {
            url: "/home",
            templateUrl: 'app/views/home.html',
            controller: 'Analysis'})
        .state('upload', {
            url: "/upload",
            templateUrl: 'app/views/upload.html',
            controller: 'Upload'})   
        .state('tasks', {
            url: "/tasks",
            templateUrl: 'app/views/tasks.html',
            controller: 'Analysis'})
        .state('apps', {
            url: "/apps",
            templateUrl: 'app/views/apps.html',
            controller: 'Analysis'})
        .state('builder', {
            url: "/builder",
            templateUrl: 'app/views/app-builder.html',
            controller: 'Analysis'})
        .state('objects', {
            url: "/objects",
            templateUrl: 'app/views/ws/objtable.html',
            controller: 'Analysis'
        })      

    $urlRouterProvider.when('', '/home/')
                      .when('/', '/home/')
                      .when('#', '/home/');

}]);


app.run(function ($rootScope, $state, $stateParams, $location) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    function login_cb() {
        $state.go('home', null, {reload: true});
    }
    function logout_cb() {
        $state.go('home', null, {reload: true});
    }

    /* auth */
    var login_ele = $('#login');
    login_ele.kbaseLogin({login_callback: login_cb, logout_callback: logout_cb});
    login_ele.css('padding-top', '14px');

    $rootScope.userId = login_ele.kbaseLogin('session').user_id;
    $rootScope.token = login_ele.kbaseLogin('session').token;

    kb = new KBCacheClient($rootScope.token);
});


angular.module('json-rpc', [])
    .config([ "$provide", "$httpProvider",
    function($provide, $httpProvider) {
    /* kbase doesn't allow content-type */
    delete $httpProvider.defaults.headers.post['Content-Type'];
    
    return $provide.decorator('$http', ['$delegate', "$rootScope", "$q", 
        function($delegate, $rootScope, $q) {

            $delegate.rpc = function(service, method, parameters, config){
                var deferred = $q.defer();       

                if (service == 'ws') {
                    var url = "https://kbase.us/services/ws";
                    var method = 'Workspace.'+method;
                }

                var data = {version: "1.1", 
                            method: method,
                            params: [parameters], 
                            id: String(Math.random()).slice(2)};

                $delegate.post(url, 
                    data, 
                    angular.extend({'headers': {'Authorization': $rootScope.token}}, config) )
                .success(function(data) {
                     deferred.resolve(data.result[0]);
                })    
                return deferred.promise;
            };

            return $delegate
        }]);
}]);
