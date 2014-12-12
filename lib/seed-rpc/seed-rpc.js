/*
 * seed-rpc.js 
 * Angular.js module for using Seed JSON-RPC services
 *
 * Authors:
 *  https://github.com/nconrad
 *
*/
angular.module('seed-rpc', ['config'])
    .config([ "$provide", "$httpProvider",
    function($provide, $httpProvider) {

    $httpProvider.defaults.headers.post['Content-Type'] = "application/x-www-form-urlencoded";
    $httpProvider.defaults.headers.put['Content-Type'] = "application/x-www-form-urlencoded";    

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

                //if (service == 'ws') {
                //var config = angular.extend({'headers': 
                //                                {'Authorization': "un=devuser|tokenid=2b5d4dbc-7422-11e4-bac4-123139141556|expiry=1448401083|client_id=devuser|token_type=Bearer|SigningSubject=https://nexus.api.globusonline.org/goauth/keys/ce30130a-71a5-11e4-a6de-22000ab68755|sig=94f692d94cf9bc71e5fccfc7290144a5dc3e86f8741a927d01c586dd14963ac6ef9432faa659099951fc8496d4aa1dae0721debc232cd7dcfadced040af4037e596bcdb346601937aedab552f841bf7473eafc16ac02da07bf94406a45d79d4302e82dacfcd516e394dfb37f78f7ebcee0b36026e8a665d7af624fc3ef868ea8"}
                //                            }, config);                    
                //} else {
                    var config = angular.extend({'headers': 
                                                {'Authorization': $rootScope.token}
                                            }, config);
                //}

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
