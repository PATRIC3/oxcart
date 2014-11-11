
/* 
 * App Tasker Model (appUI service)
 *
 *   This is responisble for the state of the app runner model
 *   Two way binding is used to update the view
 *
*/

angular.module('appTasker')
.service('shock', ['$http', '$log', 'uiTools', '$q', 'authService', 'config', 
    function($http, log, uiTools, $q, authService, config) {

    var self = this;

    var shockURL = config.services.shock_url;
    var nodeURL = shockURL+'/node';
    var auth = {Authorization: 'OAuth ' + authService.token};
    var config = {headers:  auth }

    // use angular http
    this.uploadFile = function(files) {

        //$scope.$apply( function() {
            self.uploadingCount = 1;
            self.uploadComplete = false;
        //})

        var form = new FormData($('#upload-form')[0]);
        $.ajax({
            url: nodeURL,
            type: 'POST',
            xhr: function() { 
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){ 
                    myXhr.upload.addEventListener('progress', updateProgress, false);
                }
                return myXhr;
            },            
            headers: auth,
            success: function(data) {
                //$scope.$apply(function() {
                    self.uploadingCount = 0;
                    self.uploadProgress = 0;
                    self.uploadComplete = true;
                    self.getUploads(); 
                //})
            },
            error: function(e){
                console.log('failed upload', e)
            },
            data: form,
            contentType: false,
            processData: false
        });

        function updateProgress (oEvent) {
            if (oEvent.lengthComputable) {
                var percent = oEvent.loaded / files[0].size;
                //$scope.$apply(function() {
                    self.uploadProgress = Math.floor(percent*100);
                //})
            }
        }
    }

    this.getUploads = function() {
        console.log('called')
        $http.get(nodeURL+'?querynode&owner='+authService.user+'&limit=25', config)
            .success(function(data) {
                self.loading = false;
                self.uploadCount = data.total_count;
                self.uploads = data;
                console.log('uploaded data', data)
            }).error(function(e){
                console.log('fail', e)
            })
    }

    // get upload list on load
    this.loading = true;
    this.getUploads();

}]);

 

