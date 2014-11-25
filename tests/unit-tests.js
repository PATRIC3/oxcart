
describe("Testing Services", function() {
    describe("App Service:", function() {

        //jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

        beforeEach(angular.mock.module('appTasker'));

        var app;
        var ws;
        var data;

        beforeEach(function (done) {           

            inject(['appUI', function(_appUI_) {
                app = _appUI_;
            }])

            app.updateStatus().then(function() {
                done()                 
            })
        }); 



        //it('should have an app service', function() {
        //    expect(app.test).toEqual('HELLO');
        //});


        beforeEach(function (done) {           

            inject(['workspace', function(_ws_) {
                ws = _ws_;
            }])

            ws.getWorkspaces().then(function(data) {
                data = data;

                done()                 
            })
        }); 


        it('should have a ws service', function() {
            console.log(data)
        });
        





    });

})