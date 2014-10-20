var restify = require('restify');
var http = require('http');


var ws_server = {
    hostname: 'kbase.us',
    method: 'POST',
    path: '/services/ws',
};
var fba_server = {
    hostname: 'kbase.us',
    method: 'POST',
    path: '/services/KBaseFBAModeling',
};

function ws(node_req, node_res, next) {
    console.log('here')
    var ws = node_req.params.ws;
    var name = node_req.params.name; 

    console.log(node_req.headers['Authorization'])

    if (node_req.headers['Authorization']) {
        ws_server.headers = {
           "authorization": node_req.headers['Authorization']
        }

    }

    console.log(ws_server)
    var req = http.request(ws_server, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function () {
            node_res.header('Content-Length', body.length);
            node_res.setHeader('Access-Control-Allow-Methods', '*');
            node_res.json(JSON.parse(body));
            node_res.end();
        });
    });
 
    var rpc = {params : [ [{workspace: ws, name: name}] ] ,
               method : 'Workspace.get_objects',
               version: "1.1",
               id: String(Math.random()).slice(2),
              };

    req.write(JSON.stringify(rpc));
    req.end();
}


function fba(node_req, node_res, next) {
    var ws = node_req.params.ws;
    var name = node_req.params.name; 

    var req = http.request(fba_server, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var obj = JSON.parse(body);

            var xml = obj.result;
            node_res.header('Content-Length', xml);
            node_res.contentType ='text/xml';
            node_res.send(xml);
            node_res.end();
        });
    });
 
    var rpc = {params : [ {workspace: ws, model: name, format: 'sbml'} ] ,
               method : 'fbaModelServices.export_fbamodel',
               version: "1.1",
               id: String(Math.random()).slice(2),
              };
    req.write(JSON.stringify(rpc));
    req.end();
}

function heatmap(node_req, node_res, next) {
    var refs = node_req.params.refs.split('&')

    var objs = [];

    for (var i in refs) {
        var ws = refs[i].split(',')[0];
        var name = refs[i].split(',')[1];
        objs.push({workspace: ws, name: name});
    }


    var req = http.request(ws_server, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var obj = JSON.parse(body);
            var data = obj.result[0];
            var data = parseData(data);
            console.log(JSON.stringify(data))

            node_res.header('Content-Length', data.length);
            node_res.json(data);
            node_res.end();
        });
    });
 
    var rpc = {params : [ objs ] ,
               method : 'Workspace.get_objects',
               version: "1.1",
               id: String(Math.random()).slice(2),
              };

    req.write(JSON.stringify(rpc));
    req.end();
}

function parseData(d) {
    var models = [];
    for (var i in d) {
        models.push(d[i].data);
    }

    // create heatmap data
    var rxn_names = [];
    var model_names = [];
    var data = [];

    // first, get union of reactions
    for (var i=0; i < models.length; i++) {
        var model = models[i];
        model_names.push(model.name); 

        var rxns = model.modelreactions;
        for (var j=0; j < rxns.length; j++) {
            var rxn_name = rxns[j].reaction_ref.split('/')[5];
            if (rxn_names.indexOf(rxn_name) == -1) rxn_names.push(rxn_name);
        }
    }

    var rows = [];
    for (var i=0; i < models.length; i++) {
        var rxns = models[i].modelreactions;

        var row = [];
        // for each rxn in union of rxns, try to find rxn for that model
        for (var j=0; j < rxn_names.length; j++) {
            var rxn_name = rxn_names[j];

            var found = false;
            for (var k in rxns) {
                if (rxns[k].reaction_ref.split('/')[5] == rxn_name) {
                    found = true;
                    break;
                }
            }

            row.push((found ? 1 : 0) );
        }

        rows.push(row);
    }

    return {x: rxn_names, y: model_names, data: rows};
}


// Server configuration
var server = restify.createServer();

server.get('/ws/object/:ws/:name', ws);
server.get('/fba/export/:ws/:name', fba);

// data analysis routes
server.get('/analysis/heatmap/:refs', heatmap);



server.listen(8081, function() {
  console.log('%s listening at %s', server.name, server.url);
});

server.pre(restify.CORS());
server.pre(restify.fullResponse());
server.pre(function(req, res, next) {
  req.headers['Access-Control-Allow-Methods'] = 'GET OPTIONS'
  req.headers.accept = 'application/json';
  return next();
});
