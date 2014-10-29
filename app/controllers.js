/*  
 *  Controllers
 *  See: https://docs.angularjs.org/guide/controller
 *
 *  Analysis - State goes across upload, data, apps, and tasks, using the service
 *             appUI
 *  
*/


app.controller('Analysis', 
    ['$scope', '$state', '$stateParams', 'appUI', 'uiTools', '$http',
    function($scope, $state, $stateParams, appUI, uiTools, $http) {

    // service for appUI state
    $scope.appUI = appUI;

    // selected workpsace
    $scope.selectedWS = appUI.current_ws;

    // update workspace objects if dropdown changes
    $scope.$watch('ddDisplayed', function(new_ws) {
        if (new_ws) {
            appUI.updateWSObjs(new_ws);
        }
    })

}])

.controller('Upload', 
    ['$scope', '$state', '$http', '$rootScope',
    function($scope, $state, $http, $rootScope) {

    $scope.shockURL = "http://140.221.67.190:7078"
    var url = $scope.shockURL+'/node';
    var auth = {Authorization: 'OAuth ' + $rootScope.token};
    var config = {headers:  auth }

    // use angular http
    $scope.uploadFile = function(files) {

        $scope.$apply( function() {
            $scope.uploadingCount = 1;
            $scope.uploadComplete = false;
        })

        var form = new FormData($('#upload-form')[0]);
        $.ajax({
            url: url,
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
                console.log('upload success', data)
                $scope.$apply(function() {
                    $scope.uploadingCount = 0;
                    $scope.uploadProgress = 0;
                    $scope.uploadComplete = true;
                    $scope.getUploads(); 
                })
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
                $scope.$apply(function() {
                    $scope.uploadProgress = Math.floor(percent*100);
                })
            }
        }
    }

    $scope.getUploads = function() {
        $http.get(url+'?querynode&owner=nconrad&limit=10000', config)
            .success(function(data) {
                $scope.uploads = data;
                console.log('uploaded data', data)
            }).error(function(e){
                console.log('fail', e)
            })
    }

    // get upload list on load
    $scope.getUploads();
}])

.controller('AppCell', 
    ['$scope', '$stateParams', 'appUI',
    function($scope, $stateParams, appUI) {
    // service for appUI state
    $scope.appUI = appUI;


    if ($stateParams.id) {
        appUI.setApp($stateParams.id);
    }

    $scope.getDefault = function(type) {
        return appUI.wsObjsByType[type][0].name
    }

}])

.controller('Login', function() {

})

