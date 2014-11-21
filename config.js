
/* service configuration settings for UI */
angular.module('appTasker').service('config', function() {

    this.ui = {name: "App Tasker",
			   user_login_label: "Globus username"};

    this.services = {app_url: "http://p3.theseed.org/services/app_service",
					 ws_url: "http://p3.theseed.org/services/Workspace",
                     fba_url: "https://p3.theseed.org/services/KBaseFBAModeling",
                     auth_url: "http://tutorial.theseed.org/Sessions/Login",
                     shock_url: "http://p3.theseed.org/services/shock_api"};
})
