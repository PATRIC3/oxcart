

angular.module('appTasker', 
['ui.router', 'kbase-rpc', 'directives', 'dd-filter'])
.config(['$locationProvider', '$stateProvider', 
         '$httpProvider', '$urlRouterProvider',
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
            templateUrl: 'app/views/apps.html',
            controller: 'Apps'})
        .state('app.id', {
            url: "/apps/:id",
            templateUrl: 'app/views/apps.id.html',
            resolve: {
              'GetObjs': ['appUI', function(appUI){
                return appUI.getObjs;
              }]
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

}])

.run(['$rootScope', '$state', '$stateParams', '$http', 'config',
    function ($rootScope, $state, $stateParams, $http, config) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    $rootScope.ui_name = config.ui.name;

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
}]);

