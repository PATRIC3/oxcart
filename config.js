
/* service configuration settings for UI */
angular.module('config', []).service('config', function() {

    this.ui = {name: "App Tasker",
			   user_login_label: "Username"};

    this.services = {app_url: "http://p3c.theseed.org/services/app_service",
					 ws_url: "http://p3c.theseed.org/services/Workspace",
                     fba_url: "https://p3c.theseed.org/services/KBaseFBAModeling",
                     auth_url: "http://tutorial.theseed.org/Sessions/Login",
                     shock_url: "http://p3c.theseed.org/services/shock_api"};
})
