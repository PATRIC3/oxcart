
/* service configuration settings for UI */
angular.module('appTasker').service('config', function() {

    this.ui = {name: "App Tasker"};

    this.services = {ws_url: "https://kbase.us/services/ws",
                     fba_url: "https://kbase.us/services/KBaseFBAModeling",
                     auth_url: "https://kbase.us/services/authorization/Sessions/Login"};

})