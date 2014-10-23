/*  
 *  Controllers
 *  See: https://docs.angularjs.org/guide/controller
 *
 *  Analysis - State goes across upload, data, apps, and tasks, using the service
 *             appUI
 *  
*/


app.controller('Analysis', 
    function($scope, $state, $stateParams, appUI, uiTools, $http) {

    // service for appUI state
    $scope.appUI = appUI;

    if ($stateParams.id) {
        appUI.setApp($stateParams.id);
    }

    // selected workpsace
    $scope.ddSelected = appUI.current_ws;

    // update workspace objects if dropdown changes
    $scope.$watch('ddSelected', function(new_ws) {
        appUI.updateWSObjs(new_ws);
    })

})

.controller('Upload', function($scope, $state, $http) {
    $scope.shockURL = "http://140.221.67.190:7078"

    // improve by using angular http
    $scope.uploadFile = function(files) {
        $scope.$apply( function() {
            $scope.uploadComplete = false;
        })

        //SHOCK.init({ token: USER_TOKEN, url: $scope.shockURL })
        //SHOCK.upload('uploader')

        var form = new FormData($('form')[0]);
        $.ajax({
            url: $scope.shockURL+'/node',  //Server script to process data
            type: 'POST',
            xhr: function() { 
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){ 
                    myXhr.upload.addEventListener('progress', updateProgress, false);
                }
                return myXhr;
            },            
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", SHOCK.auth_header.Authorization);
            },
            success: function(data) {
                $scope.$apply(function() {
                    $scope.uploadProgress = 0;
                    $scope.uploadComplete = true; 
                })

            },
            error: function(e){
                console.log('fail', e)
            },
            data: form,
            cache: false,
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
})

.controller('Login', function() {



})

