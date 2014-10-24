describe('app tasker home', function() {
    var url = "http://localhost/oxcart/#/app-tasker"
    var annotate_url = "http://localhost/oxcart/#/app-tasker/apps/Annotate-ContigSet"


    var input1 = element(by.id('input-Scientific-Name'));
    var input2 = element(by.id('input-Genetic-Code'));
    var run = element(by.css('.btn-primary'));
    var taskCount = element(by.id('task-count'));

    beforeEach(function() {
        browser.get(annotate_url);
    });

    
    it('should have a title', function() {
        expect(browser.getTitle()).toEqual('App Tasker');
    });

    it('test annotate genome', function() {
        input1.sendKeys('Some awesome sci name');
        input2.sendKeys('genetic code foo bar');
        run.click();

        // check to see if task number was incremented
        expect( taskCount.getText()).toEqual('1') ;
        run.click();
        expect( taskCount.getText()).toEqual('2') ;        
    });


});