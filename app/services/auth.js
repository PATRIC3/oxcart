/*
 * kbase-auth.js 
 * Angular.js module for using KBase authentication services
 *
 * Readme: 
 *  (coming someday)
 *
 * Authors:
 *  https://github.com/nconrad
 *
*/

angular.module('kbase-auth', [])
.service('authService', ['$http', 'config', function($http, config) {
    var self = this;


    var auth = JSON.parse( localStorage.getItem('auth') );

    // if authenticated, set user/token
    if (auth) {
        this.user = auth.user_id;
        this.token = auth.token;
    } else {
        this.user;
        this.token;
    }

    this.login = function(user, pass) {
        var data = {user_id: user, 
                    password: pass,
                    status: 1,
                    cookie:1,
                    fields: "name,kbase_sessionid,user_id,token"}

        return $http({method: "POST",
                url: config.services.auth_url,
                data: $.param(data),
             }).then(function(data) {

                // store token
                localStorage.setItem('auth', JSON.stringify(data.data));
                self.user = data.data.user_id;
                self.token = data.data.token;

                return data.data;
             })
    }

    this.logout = function() {
        localStorage.removeItem('auth');
    }

    this.isAuthenticated = function() {
        return self.user ? true : false;
    }

}]);



