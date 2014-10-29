
/* 
 *  UI Tools
 *
 *   Module for various jQuery-based UI elements/helpers
 *
*/


angular.module('appTasker')
.service('uiTools', function() {
    // this method will display an absolutely position notification
    // in the app on the 'body' tag.  This is useful for api success/failure 
    // notifications
    this.notify = function(text, type, keep) {
        var ele = $('<div id="notification-container">'+
                        '<div id="notification" class="'+type+'">'+
                            (keep ? ' <small><div class="close">'+
                                        '<span class="glyphicon glyphicon-remove pull-right">'+
                                        '</span>'+
                                    '</div></small>' : '')+
                            text+
                        '</div>'+
                    '</div>');

        $(ele).find('.close').click(function() {
             $('#notification').animate({top: 0}, 200, 'linear');
        })

        $('body').append(ele)
        $('#notification')
              .delay(200)
              .animate({top: 50}, 400, 'linear',
                        function() {
                            if (!keep) {
                                $('#notification').delay(2000)
                                                  .animate({top: 0}, 200, 'linear', function() {
                                                    $(this).remove();
                                                  })

                            }
                        })
    }

    var msecPerMinute = 1000 * 60;
    var msecPerHour = msecPerMinute * 60;
    var msecPerDay = msecPerHour * 24;
    var dayOfWeek = {0: 'Sun', 1: 'Mon', 2:'Tues',3:'Wed',
                     4:'Thurs', 5:'Fri', 6: 'Sat'};
    var months = {0: 'Jan', 1: 'Feb', 2: 'March', 3: 'April', 4: 'May',
                  5:'June', 6: 'July', 7: 'Aug', 8: 'Sept', 9: 'Oct', 
                  10: 'Nov', 11: 'Dec'};
    this.formateDate = function(timestamp) {
        var date = new Date()

        var interval =  date.getTime() - timestamp;

        var days = Math.floor(interval / msecPerDay );
        interval = interval - (days * msecPerDay);

        var hours = Math.floor(interval / msecPerHour);
        interval = interval - (hours * msecPerHour);

        var minutes = Math.floor(interval / msecPerMinute);
        interval = interval - (minutes * msecPerMinute);

        var seconds = Math.floor(interval / 1000);

        if (days == 0 && hours == 0 && minutes == 0) {
            return seconds + " secs ago";
        } else if (days == 0 && hours == 0) {
            if (minutes == 1) return "1 min ago";
            return  minutes + " mins ago";
        } else if (days == 0) {
            if (hours == 1) return "1 hour ago";
            return hours + " hours ago"
        } else if (days == 1) {
            var d = new Date(timestamp);
            var t = d.toLocaleTimeString().split(':');        
            return 'yesterday at ' + t[0]+':'+t[1]+' '+t[2].split(' ')[1]; //check
        } else if (days < 7) {
            var d = new Date(timestamp);        
            var day = dayOfWeek[d.getDay()]
            var t = d.toLocaleTimeString().split(':');
            return day + " at " + t[0]+':'+t[1]+' '+t[2].split(' ')[1]; //check
        } else  {
            var d = new Date(timestamp);
            return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); //check
        }
    }

    // takes mod date time (2014-03-24T22:20:23)
    // and returns unix (epoch) time
    this.getTimestamp = function(datetime){
        if (!datetime) return; 
        var ymd = datetime.split('T')[0].split('-');
        var hms = datetime.split('T')[1].split(':');
        hms[2] = hms[2].split('+')[0];  
        return Date.UTC(ymd[0],ymd[1]-1,ymd[2],hms[0],hms[1],hms[2]);  
    }

    // interesting solution from http://stackoverflow.com/questions
    // /15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript 
    this.readableSize = function(bytes) {
       var units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
       if (bytes == 0) return '0 Bytes';
       var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
       return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + units[i];
    };    

    this.objTable = function(p) {
        var obj = p.obj;
        var keys = p.keys;

        // option to use nicely formated keys as labels
        if (p.keysAsLabels ) {
            var labels = []            
            for (var i in keys) {
                var str = keys[i].key.replace(/(id|Id)/g, 'ID')
                var words = str.split(/_/g);
                for (var j in words) {
                    words[j] = words[j].charAt(0).toUpperCase() + words[j].slice(1)
                }
                var name = words.join(' ')
                labels.push(name);
            }
        } else if ('labels' in p) {
            var labels = p.labels;
        } else {
            // if labels are specified in key objects, use them
            for (var i in keys) {
                var key_obj = keys[i];
                if ('label' in key_obj) {
                    labels.push(key_obj.label);                    
                } else {
                    labels.push(key_obj.key)
                }   

            }
        }


        var table = $('<table class="table table-striped table-bordered">');
//        style="margin-left: auto; margin-right: auto;"

        for (var i in keys) {
            var key = keys[i];
            var row = $('<tr>');

            if (p.bold) {
                var label = $('<td><b>'+labels[i]+'</b></td>')
            } else {
                var label = $('<td>'+labels[i]+'</td>');
            }

            var value = $('<td>');

            if ('format' in key) {
                var val = key.format(obj)
                value.append(val)
            } else if (key.type == 'bool') {
                value.append((obj[key.key] == 1 ? 'True' : 'False'))
            } else {
                value.append(obj[key.key])
            }
            row.append(label, value);

            table.append(row);
        }

        return table;
    }

    this.listTable = function(p) {
        var array = p.array;
        var labels = p.labels;
        var bold = (p.bold ? true : false);

        var table = $('<table class="table table-striped table-bordered" \
                              style="margin-left: auto; margin-right: auto;"></table>');
        for (var i in labels) {
            table.append('<tr><td>'+(bold ? '<b>'+labels[i]+'</b>' : labels[i])+'</td> \
                          <td>'+array[i]+'</td></tr>');
        }

        return table;
    }

    // this takes a list of refs and creates <workspace_name>/<object_name>
    // if links is true, hrefs are returned as well
    this.translateRefs = function(reflist, links) {
        var obj_refs = []
        for (var i in reflist) {
            obj_refs.push({ref: reflist[i]})
        }

        var prom = kb.ws.get_object_info(obj_refs)
        var p = $.when(prom).then(function(refinfo) {
            var refhash = {};
            for (var i=0; i<refinfo.length; i++) {
                var item = refinfo[i];
                var full_type = item[2];
                var module = full_type.split('.')[0];
                var type = full_type.slice(full_type.indexOf('.')+1);
                var kind = type.split('-')[0];
                var label = item[7]+"/"+item[1];
                var route;
                switch (kind) {
                    case 'FBA': 
                        sub = 'fbas/';
                        break;
                    case 'FBAModel': 
                        sub = 'models/';
                        break;
                    case 'Media': 
                        route = 'media/';
                        break;
                    case 'Genome': 
                        route = 'genomes/';
                        break;
                    case 'MetabolicMap': 
                        route = 'maps/';
                        break;
                    case 'PhenotypeSet': 
                        route = 'phenotype/';
                        break; 
                }

                var link = '<a href="#/'+route+label+'">'+label+'</a>';
                refhash[reflist[i]] = {link: link, label: label};
            }
            return refhash
        })
        return p;
    }

    this.refsToJson = function(ref_list) {
        var obj_refs = []
        for (var i in ref_list) {
            obj_refs.push({ref: ref_list[i]})
        }

        var obj = {}
        var prom = kb.ws.get_object_info(obj_refs)
        var p = $.when(prom).then(function(refinfo) {
            for (var i=0; i<refinfo.length; i++) {
                var item = refinfo[i];
                var full_type = item[2];
                var module = full_type.split('.')[0];
                var type = full_type.slice(full_type.indexOf('.')+1);
                var kind = type.split('-')[0];
                var label = item[7]+"/"+item[1];

                if ( !(kind in obj) )  obj[kind] = [];

                obj[kind].push(label);
            }
            return obj;
        })
        return p;
    }

           
    this.formatUsers = function(perms, mine) {
        var users = []
        for (var user in perms) {
            if (user == USER_ID && !mine && !('*' in perms)) {
                users.push('You');
                continue;
            } else if (user == USER_ID) {
                continue;
            } 
            users.push(user);
        }

        // if not shared, return 'nobody'
        if (users.length == 0) {
            return 'Nobody';
        };

        // number of users to show before +x users link
        var n = 3;
        var share_str = ''
        if (users.length > n) {
            /*if (users.slice(n).length == 1) {*/
                share_str = users.slice(0, n).join(', ')+', '+
                        ' <a class="btn-share-with" data-users="'+users+'">+'
                        +users.slice(n).length+' user</a>';  
            /*} else if (users.slice(2).length > 1) {
                share_str = users.slice(0, n).join(', ')+ ', '+
                        ' <a class="btn-share-with" data-users="'+users+'"> +'
                        +users.slice(n).length+' users</a>';
            }*/

        } else if (users.length > 0 && users.length <= n) {
            share_str = users.slice(0, n).join(', ');
        }
        return share_str;
    }


});


 

