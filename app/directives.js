/*
 * App Runner directives
 *  - appCell : extends functionality of a cell
 *  - fixedHeader : fixes a resizeable table header
 *  - validate : validation for forms (used in apps)
 *  - tooltip : bootstrap tooltip
 *  - focusOn : sets focus on element for user
 *  - sidebarCollapse : collapseable sidebaar, adjusting dom
 *  - apiDoc : experiementing with api docs
 *
 * Controllers:  (See Analysis in js/controllers.js)
 *
 *
 * Authors:
 *  Neal Conrad <nconrad@anl.gov>
 *
 * Todo:
 *  - Use models instead of DOM ids inputs for appCell and ddFilter.
 *    This will help with testing as well
 *
 *
*/

'use strict';

angular.module('directives', ['controllers'])
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


.directive('whenScrolled', function() {
    return function(scope, elm, attr) {
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
                if (/^\-?\d+$/.test(viewValue)) return true;

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


// todo: use ngMaterial instead
.directive('sidebarCollapse', function() {
    return {
        link: function(scope, element, attr) {
            var original_w = 200,
                new_w = 56,
                page_id = '#page-wrapper',
                page_id2 = '#table-page-wrapper',
                collapsed = false;

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


.directive('apiDoc', ['$http', '$stateParams', function($http, $stateParams) {
    return {
        link: function(scope, elem, attr) {
            var service = $stateParams.service;

            scope.service = service;

            scope.isBasicType = function(type) {
                var types = ['bool', 'int', 'string'];

                if (types.indexOf(type) != -1)
                    return true
                return false
            }

            $http.get('./docs/'+service+'.spec')
                 .success(function(data){
                      parseSpec(data)
                 })

            function parseSpec(data) {
                //var data = data.replace(/(\r\n|\n|\r)/g,'');

                var types = [],
                    structs = [],
                    methods = [];

                // assumes nested structs are not possible
                var foundStruct = true;

                // find structures
                var structs = getStructures(data)

                // find methods
                var methods = getMethods(data);

                // find types
                var types = getTypes(data);


                // join structures and types to methods
                // replace "types" with true type
                methods.forEach(function(method){
                    method.inputs.forEach(function(input) {
                        for (var i=0; i<structs.length; i++) {
                            var struct = structs[i];

                            // add info for any custom types
                            for (var k=0; k<struct.params.length; k++) {
                                var param = struct.params[k];

                                var typeDetails = [];
                                for (var type in types) {
                                    if (param.type.indexOf(type) != -1)
                                        typeDetails.push(types[type])
                                }

                                param.typeDetails = typeDetails;
                            }

                            // join
                            if (struct.name == input.type)
                                input.structure = struct;
                        }
                    })


                    method.returns.forEach(function(ret) {
                        var returnType = ret.type;

                        var typeDetails = [];
                        for (var type in types) {
                            if (returnType.indexOf(type) != -1)
                                typeDetails.push(types[type])
                        }

                        for (var i=0; i<structs.length; i++) {
                            var struct = structs[i];

                            if (returnType.indexOf(struct.name) != -1)
                                typeDetails.push(struct);
                        }

                        ret.typeDetails = typeDetails;

                    })
                })

                scope.types = types;
                scope.methods = methods;
                scope.structures = structs;
            }

            function getMethods(data) {
                var methods = []

                var matches = data.match(/funcdef\s+\w+\([\w\W]+?\)[\w\W]+?;/g);

                matches.forEach(function(match) {
                    var match = match.trim();
                    var func = match.split('returns')[0]

                    var name = func.slice(func.indexOf(' '), func.indexOf('(')).trim()

                    // assume one input for now
                    var inputs = func.match(/\(([\w\W]+?)\)/g)[0]
                                    .replace('(', '')
                                    .replace(')', '')

                    inputs = [{type: inputs.split(' ')[0].trim(),
                               name: inputs.split(' ')[1].trim() }]

                    var returns = match.split('returns')[1];

                    // assume one return for now
                    returns = returns.match(/\(([\w\W]+?)\)/g)[0]
                                         .replace('(', '')
                                         .replace(')', '');

                    returns = [{type: returns.split(' ')[0], name: returns.split(' ')[1]}];

                    methods.push({name: name, inputs: inputs, returns: returns});
                })

                return methods;
            }

            //typedef\s+[\w\W]+?\s+[\w\w]+?;

            function getTypes(data) {
                var types = {};
                var matches = data.match(/\/\*[\d\t\n\s\d\w;"=,'_\}\{\/.<\:>()-]+\*\/[\s]+typedef\s+[\w\W]+?\s+[\w\w]+?;/g);

                matches.forEach(function(match) {
                    var match = match.trim();
                    if (match.indexOf('structure') != -1) return;

                    var description  = match.split('*/')[0]
                                     .replace('/*','')
                                     .trim();

                    // remove description
                    var match = match.split('*/')[1].trim()

                    if (match.indexOf('tuple') != -1) {
                        var type = 'tuple';
                        var e = match.lastIndexOf('>')+1;
                        var name = match.slice(e, match.length).replace(';','').trim()
                        var info = parseInfo(description);
                    } else {
                        var type = match.split(/\s+/)[1],
                            name = match.split(/\s+/)[2].replace(';', '');
                    }

                    types[name] = {type: type, name: name, description: description, info: info};
                })

                return types
            }

            // takes a formated doc string, produces list of dicts
            function parseInfo(info) {
                var tupleInfo = []

                var matches = info.match(/^[\s\w]+\s\-\s[\w\W]+$/gm);

                if (!matches) return;

                matches = matches[0].split('\n');

                matches.forEach(function(match) {
                    if (match == '') return;

                    var match = match.trim(),
                        typeAndName = match.split(' - ')[0].trim(),
                        descript = match.split(' - ')[1].trim();

                    var kind = typeAndName.split(' ');
                    if (kind.length > 1) {
                        var type = kind[0]
                        var name = kind[1]; //ignore arbitrary name
                    } else
                        var type = kind[0]

                    tupleInfo.push({type: type, name: name, description: descript})
                })

                return tupleInfo;
            }

            function getStructures(data) {
                var structs = [];

                var matches = data.match(/(\/\*[\d\t\n\s\d\w;"=,'_\}\{\/.<\:>()-]+\*\/)[\s\n\t]+typedef\s+structure\s+\{[\n\t\s\w\d;,><]*\}\s+\w+;/g)

                if (matches) {
                matches.forEach(function(match) {
                    var params = [];

                    var info  = match.split('*/')[0]
                                     .replace('/*','')
                                     .trim();

                    // description for struct/method
                    var regex = /Description:([\w\W]+?)Parameters:/g;
                    var description = info.match(regex)

                    if (description)
                        description = description[0].replace('Description:', '')
                                                    .replace('Parameters:', '').trim();

                    // param documentation
                    regex = /Parameters:([\w\W]+)/g;
                    var paramInfo = info.match(regex)

                    if (paramInfo) {
                        paramInfo = paramInfo[0].replace('Parameters:','')
                                                .trim()
                                                .split('\n')

                        var paramDocs = {}
                        paramInfo.forEach(function(param) {
                            var param = param.trim(),
                                item = param.split(' - ')[0],
                                descript = param.split(' - ')[1],
                                type = param.split(' ')[0],
                                name = param.split(' ')[1];

                            paramDocs[name] = {name: name, type: type, description: descript}
                        })
                    }

                    // remove description, not used anymore
                    var match = match.split('*/')[1]

                    // get name of structure
                    var structureName = match.split('}')[1]
                                             .replace(';', '');

                    // get params
                    var items = match.match(/({[\n\t\s\w\d;,><]*\})/g)[0]
                                      .replace('{', '')
                                      .replace('}', '')
                                      .split(';')

                    items.forEach(function(param) {
                        var param = param.trim()

                        if (param == '') return;  // skip last ';'

                        var type = param.trim().split(' ')[0];
                        var name = param.trim().split(' ')[1].replace(';','');
                        params.push({type: type,
                                     name: name,
                                     description: (paramDocs && name in paramDocs
                                            ? paramDocs[name].description : '(No Description)')
                                    })

                    })

                    structs.push({name: structureName.trim(),
                                  type: 'structure',
                                  params: params,
                                  description: description})
                  })
                }  // end if mataches

                return structs;
            }
        }
    }
}])

.directive('typeLabel', function() {
    return {
        link: function(scope, elem, attr) {

            var ele = angular.element(elem);

            ele.addClass('label')
            if (attr.typeLabel == 'string')
                ele.addClass('label-primary')
            else if (attr.typeLabel == 'int')
                ele.addClass('label-default')
            else if (attr.typeLabel == 'bool') {
                ele.addClass('label-default')
                ele.text('int')
            } else
                ele.addClass('label-danger')


        }
    }
})

.filter('unsafe', function($sce) { return $sce.trustAsHtml; });

