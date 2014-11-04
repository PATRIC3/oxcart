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

    var auth = getSession();

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
                    fields: "name,kbase_sessionid,user_id,token"};

        return $http({method: "POST",
                      url: config.services.auth_url,
                      data: $.param(data),
                    }).success(function(data) {
                        // store token
                        localStorage.setItem('auth', JSON.stringify(data));
                        self.user = data.user_id;
                        self.token = data.token;

                        return data;
                    });
    }

    this.logout = function() {
        localStorage.removeItem('auth');
    }

    this.isAuthenticated = function() {
        return (self.user && getSession()) ? true : false;
    }

    function getSession() {
        return JSON.parse( localStorage.getItem('auth') );
    }

}]);



