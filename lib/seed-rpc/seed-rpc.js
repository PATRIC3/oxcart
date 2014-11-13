/*
 * seed-rpc.js 
 * Angular.js module for using Seed JSON-RPC services
 *
 * Authors:
 *  https://github.com/nconrad
 *
*/
angular.module('seed-rpc', [])
    .config([ "$provide", "$httpProvider",
    function($provide, $httpProvider) {

    $httpProvider.defaults.headers.post['Content-Type'] = "application/x-www-form-urlencoded";

    return $provide.decorator('$http', ['$delegate', "$rootScope", "$q", "config",
        function($delegate, $rootScope, $q, $config) {
            
            $delegate.rpc = function(service, method, parameters){
                var deferred = $q.defer();       

                // short hand service names
                if (service == 'app') {
                    var url = $config.services.app_url;
                    var method = 'AppService.'+method;                    
                } else if (service == 'ws') {
                    var url = $config.services.ws_url;
                    var method = 'Workspace.'+method;
                } else if (service == 'fba') {
                    var url = $config.services.fba_url;
                    var method = 'fbaModelServices.'+method;
                } 

                var data = {version: "1.1", 
                            method: method, 
                            id: String(Math.random()).slice(2)};

                if (parameters) {
                    data.params = (parameters.constructor === Array ? parameters : [parameters]);
                }

                var config = angular.extend({'headers': 
                                                {'Authorization': $rootScope.token}
                                            }, config);
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
