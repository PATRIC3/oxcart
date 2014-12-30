

angular.module('appTasker',
['ui.router',
 'config',
 'seed-rpc',
 'kbase-auth',
 'workspace',
 'upload',
 'directives',
 'controllers',
 'uiTools',
 'dd-filter',
 'ng-browse',
 'ngMaterial',
 'ng-context-menu',
 'appUI'])
.config(['$locationProvider', '$stateProvider',
         '$httpProvider', '$urlRouterProvider', '$logProvider',
    function($locationProvider, $stateProvider, $httpProvider, $urlRouterProvider, $logProvider) {

    $logProvider.debugEnabled(false);

    $locationProvider.html5Mode(false);

    $stateProvider
        .state('login', {
            url: "/login",
            templateUrl: 'app/views/login.html',
            controller: 'Login',
            authenticate: false})
        .state('app', {
            url: "/app-tasker",
            templateUrl: 'app/views/home.html',
            authenticate: true})
        .state('app.upload', {
            url: "/upload",
            templateUrl: 'app/views/upload.html',
            controller: 'Upload',
            authenticate: true})
        .state('app.tasks', {
            url: "/tasks",
            templateUrl: 'app/views/tasks.html',
            controller: 'TaskStatus',
            authenticate: true})
        .state('app.ws', {
            url: "/ws",
            templateUrl: 'app/views/ws/ws.html',
            controller: 'WS',
            authenticate: true})
        .state('app.public', {
            url: "/public",
            templateUrl: 'app/views/ws/public.html',
            controller: 'WS',
            authenticate: true})
        .state('app.dir', {
            url: "/ws{dir:.*}",
            templateUrl: 'app/views/ws/ws.dir.html',
            resolve: {
              'GetApps': ['appUI', function(appUI){
                return appUI.getApps;
              }],
            },
            controller: 'WS',
            authenticate: true})
        .state('app.apps', {
            url: "/apps/",
            templateUrl: 'app/views/apps.html',
            controller: 'Apps',
            authenticate: false})
        .state('app.id', {
            url: "/apps/:id",
            templateUrl: 'app/views/apps.id.html',
            resolve: {
              'GetApps': ['appUI', function(appUI){
                return appUI.getApps;
              }],
              'GetWS': ['workspace', function(workspace){
                return workspace.getWS;
              }]
            },
            controller: 'AppCell',
            authenticate: true})

        .state('app.test', {
            url: "/apps/test/:file",
            templateUrl: 'app/views/apps.id.html',
            resolve: {
              'GetApps': ['appUI', function(appUI){
                return appUI.getApps;
              }],
              'GetWS': ['workspace', function(workspace){
                return workspace.getWS;
              }]
            },
            controller: 'AppCell',
            authenticate: true})
        .state('app.builder', {
            url: "/builder",
            templateUrl: 'app/views/app-builder.html',
            authenticate: true})
        .state('app.objects', {
            url: "/objects",
            templateUrl: 'app/views/ws/objtable.html',
            authenticate: true
        })


        // user pages
        .state('user', {
            url: "/user",
            templateUrl: 'app/views/user/profile.html',
            authenticate: false
        })
        .state('userSettings', {
            url: "/user-settings",
            templateUrl: 'app/views/user/settings.html',
            authenticate: false
        })

        // help/documentation
        .state('app.help', {
            url: "/help",
            templateUrl: 'app/views/help/help.html',
            authenticate: false
        }).state('app.proto', {
            url: "/proto",
            templateUrl: 'app/views/proto.html',
            authenticate: false
        });




    $urlRouterProvider.when('', '/app-tasker')
                      .when('/', '/app-tasker')
                      .when('#', '/app-tasker');

    // Send to login if the URL was not found
    $urlRouterProvider.otherwise("/login");

}])

.run(['$rootScope', '$state', '$stateParams', '$http', 'config', 'authService',
    function ($rootScope, $state, $stateParams, $http, config, authService) {

    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
        if (toState.authenticate && !authService.isAuthenticated()){
            $state.go('login');
            event.preventDefault();
        }
    })

    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    $rootScope.ui_name = config.ui.name;
    $rootScope.login_label = config.ui.user_login_label;

    $rootScope.user = authService.user;
    $rootScope.token = authService.token;
}])


