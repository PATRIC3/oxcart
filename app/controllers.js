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

    // selected workpsace
    $scope.selectedWS = appUI.current_ws;

    // update workspace objects if dropdown changes
    $scope.$watch('ddDisplayed', function(new_ws) {
        if (new_ws) {
            appUI.updateWSObjs(new_ws);
        }
    })

})

.controller('Upload', function($scope, $state, $http, $rootScope) {
    $scope.shockURL = "http://140.221.67.190:7078"
    SHOCK.init({ token: $rootScope.token, url: $scope.shockURL })    

    // improve by using angular http
    $scope.uploadFile = function(files) {
        $scope.$apply( function() {
            $scope.uploadComplete = false;
        })

        console.log(SHOCK.auth_header.Authorization)
        var form = new FormData($('#upload-form')[0]);

        $.ajax({
            url: $scope.shockURL+'/node',
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
                console.log('upload success', data)
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


    $.ajax({
        url: $scope.shockURL+'/node?query&owner='+$rootScope.userId , 
        type: 'GET',
        beforeSend: function (request) {
            request.setRequestHeader("Authorization", SHOCK.auth_header.Authorization);
        },
        success: function(data) {
            console.log('data', data)
            $scope.$apply(function() {
                $scope.uploads = data;
            })
        },
        error: function(e){
            console.log('fail', e)
        },
        contentType: false,
            cache: false,
            processData: false        
    });


})

.controller('AppCell', function($scope, $stateParams, appUI) {
    // service for appUI state
    $scope.appUI = appUI;


    if ($stateParams.id) {
        appUI.setApp($stateParams.id);
    }

    $scope.getDefault = function(type) {
        return appUI.wsObjsByType[type][0].name
    }

})


.controller('Login', function() {



})

