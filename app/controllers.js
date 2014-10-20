/*  
 *  Controllers
 *  See: https://docs.angularjs.org/guide/controller
 *
 *  Analysis - State goes across upload, data, apps, and tasks, using the service
 *             appUI
 *  
*/


app.controller('Analysis', function($scope, $state, $stateParams, appUI, $http) {
    // service for appUI state
    $scope.appUI = appUI;

    // selected workpsace
    $scope.ddSelected = appUI.current_ws;
    $scope.ws = $scope.ddSelected; // scope.ws variable for workspace browser


    if (!appUI.ws_objects) {
        $http.rpc('ws', 'list_objects', {workspaces: [$scope.ddSelected] } )
        .then(function(data){
            appUI.ws_objects = data;

            var types = {};
            for (var i in data) {
                var type = data[i][2].split('-')[0];
                var obj = {name: data[i][1], id: data[i][0]};

                if (type in types) {
                    types[type].push(obj);
                } else {
                    types[type] = [obj];
                }
            }

            appUI.wsObjsByType = types
        })
    }

    $http.rpc('ws', 'list_workspace_info', {perm: 'w'} )
    .then(function(workspaces) {
        var workspaces = workspaces.sort(compare)

        function compare(a,b) {
            var t1 = kb.ui.getTimestamp(b[3]) 
            var t2 = kb.ui.getTimestamp(a[3]) 
            if (t1 < t2) return -1;
            if (t1 > t2) return 1;
            return 0;
        }

        var ws_list = [];
        for (var i in workspaces) {
            ws_list.push({name: workspaces[i][1], id: workspaces[i][0]})
        }

        appUI.ws_list = ws_list
    });

    // update workspace objects if dropdown changes
    $scope.$watch('ddSelected', function(new_ws) {
        $http.rpc('ws', 'list_objects', {workspaces: [new_ws]})
        .then(function(data) {

            appUI.ws_objects = data;

            // if newly selected workspace is not the same
            // as current, go to workspace browser view 
            if (appUI.current_ws != new_ws) {
                appUI.current_ws = new_ws;                    
                $state.go('analysis.objects', null, {reload: true});
            }

        })  
    })

})

.controller('Upload', function($scope, $state, $stateParams, $http) {
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

