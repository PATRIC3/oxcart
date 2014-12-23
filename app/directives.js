/*
 * App Runner directives
 *  - appCell : extends functionality of a cell
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

var INTEGER_REGEXP = /^\-?\d+$/;

angular.module('directives', [])
.directive('appCell', ['appUI', function(appUI) {
    return {
        link: function(scope, ele, attrs) {

            // dictionary for fields in form.  Here, keys are the ui_name
            //scope.fields = {};

            scope.flip = function($event) {
                $($event.target).parents('.panel').find('.narrative-cell').toggleClass('flipped')
            }

            scope.minimize = function($event) {
                $($event.target).parents('.panel').find('.panel-body').slideToggle('fast');
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
/*
.directive('ngRightClick', ['$parse', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
}])*/

.directive('whenScrolled', function() {
    return function(scope, elm, attr) {
        console.log('HERE!')
        var raw = elm[0];

        $(elm).on('scroll', function() {
            console.log('scroll', raw.scrollTop + raw.offsetHeight, raw.scrollHeight)
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight){
                scope.$apply(attr.whenScrolled);
                console.log('doing something!')
            }

        });
    };
})


.directive('tooltip', function() {
    return {
        link: function(scope, element, attr) {
            var title = attr.tooltip;
            $(element).tooltip({title: title});
        }
    }
})

.directive('fixedHeader', ['$window', '$timeout', function($window, $timeout) {
   return function(scope, elem, attr) {

        var header_id = '#'+attr.fixedHeader;
        var table_id = '#'+attr.fixedTable;

        var w = angular.element($window);
        w.bind('resize', function() {
            adjustHeader();
        })

        function adjustHeader() {
            var headers = elem.find('th');
            var orig_headers = angular.element(table_id).find('th');

            angular.forEach(orig_headers, function(v, k) {
                // .css is the jquery
                $(headers[k]).css({width: orig_headers[k].clientWidth});
            })
        }

        scope.$watch('loading', function() {
            $timeout(function() {
                adjustHeader();
            });
        });
   };
}])

.directive('validate', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {

        var type = attrs.validate;

        ctrl.$validators.validate = function(modelValue, viewValue) {
            scope.errorMsg = false;
            if (type == 'int') {
                if (ctrl.$isEmpty(modelValue)) return true;
                if (INTEGER_REGEXP.test(viewValue)) return true;

                // else fail
                scope.errorMsg = "this field must be an integer";
                return false;
            }

        };
    }
  };
})

.directive('focusOn', function() {
   return function(scope, elem, attr) {
      scope.$on(attr.focusOn, function(e) {
          elem[0].focus();
      });
   };
})

.directive('fileBrowser', ['$timeout', function($timeout) {
   return function(scope, elem, attr) {

        scope.openFolder = function(folder) {
            scope.loading = true;

            $timeout(function() {
                scope.loading = false;
            }, 1000)

        }
   };
}])

// todo: use ngMaterial instead
.directive('sidebarCollapse', function() {
    return {
        link: function(scope, element, attr) {
            var original_w = 200;
            var new_w = 56;
            var page_id = '#page-wrapper';
            var page_id2 = '#table-page-wrapper';
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
                    if ($(page_id).length) var id = page_id;
                    else var id = page_id2;

                    $(id).animate({
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

                    if ($(page_id).length) var id = page_id;
                    else var id = page_id2;

                    $(id).animate({
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