/*
 * App Runner directives
 *  - narrativeCell : extends functionality of a cell 
 *  - kbWidget : wrapper for kbase jquery output widgets
 *  - ddFilter : searchable angular, bootstrapifyed dropdown used 
 *                 for selectors
 *
 * Controllers:  (See Analysis in js/controllers.js)
 *
 *
 * Authors:
 *  Neal Conrad <nconrad@cels.anl.gov>
 *
 * Todo:
 *  - Use models instead of DOM ids inputs for appCell and ddSelector.
 *    This will help with testing as well
 *
 *
*/

angular.module('directives', [])
.directive('appCell', ['appUI', function(appUI) {
    return {
        link: function(scope, ele, attrs) {

            // dictionary for fields in form.  Here, keys are the ui_name 
            scope.fields = {};  

            scope.flip = function($event) {
                $($event.target).parents('.panel').find('.narrative-cell').toggleClass('flipped')
            }

            scope.minimize = function($event) {
                $($event.target).parents('.panel').find('.panel-body').slideToggle('fast');
            }

            scope.runCell = function(index, app) {
                appUI.startApp(app.id, scope.fields);
            }


        }
    }
}])

.directive('showData', function() {
    return {
        link: function(scope, ele, attrs) {

        }
    }
})

.directive('kbWidget', function() {
    return {
        link: function(scope, element, attrs) {
            // instantiation of a kbase widget
        }
    }
})

.directive('tooltip', function() {
    return {
        link: function(scope, element, attr) { 
            var title = attr.tooltip;

            $(element).tooltip({title: title});

        }
    }
})

.directive('sidebarCollapse', function() {
    return {
        link: function(scope, element, attr) {
            var original_w = 200;
            var new_w = 56;

            var collapsed = false;

            element.click(function() {

                if ( !collapsed ){
                    element.find('.fa-caret-left').fadeOut(function() {
                        $(this).remove();
                    });
                    var caret = $('<span class="fa fa-caret-right">').hide().fadeIn();
                    element.append(' ', caret);

                    // animation for 
                    $('.sidebar-nav, .sidebar').hide('slide', {
                            direction: 'left'
                        }, 350, function() {
                            $('.sidebar').show();
                            $('.sidebar').css('width', new_w)
                        });   

                    // animation for margin of page view
                    $('#page-wrapper').animate({
                            marginLeft: new_w,
                        }, 400, function() {
                            $('.sidebar-nav-small').fadeIn('fast');
                            collapsed = true
                        });
                   
                } else {
                    element.find('.fa-caret-right').fadeOut(function() {
                        $(this).remove();
                    });
                    var caret = $('<span class="fa fa-caret-left">').hide().fadeIn()
                    element.prepend(caret, ' ')

                    $('.sidebar-nav-small').fadeOut('fast');
                    
                    $('#page-wrapper').animate({
                            marginLeft: original_w,
                        }, 300, function() {
                            $('.sidebar').css('width', original_w)
                            $('.sidebar-nav').fadeIn('fast')
                            collapsed = false
                        }); 
                }
                 
                
            })

        }
    }
})