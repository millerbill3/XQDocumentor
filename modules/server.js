var express = require('express');
var app = express(),
	http = require('http'),
  	path = require('path'),
    fs = require('fs'),

    bodyParser = require('body-parser');

module.exports = {
	startServer : function(port, rootDir, jsonDirectory){
        var assignedPort = process.env.PORT || port || 3000;
        app.locals.moment = require('moment');
        app.set('port', assignedPort);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        //app.use(express.favicon());
        //app.use(express.logger('dev'));
        //app.use(bodyParser.json());
        //app.use(express.methodOverride());
        //app.use(express.cookieParser('your secret here'));
        //app.use(express.session());
        var public = path.join(rootDir, '/public');
        var views = path.join(rootDir, '/views');
        //var outputDir = path.join(rootDir, jsonDirectory);

        app.use(express.static(public));
        app.use(express.static(views));
        //app.use(express.static(outputDir));

        app.get('/output/:file', function(req, res){
            var retData = JSON.parse(fs.readFileSync(path.join(rootDir,jsonDirectory, req.params.file), 'utf8'));
            res.render(path.join(views,"module_view"),{results: retData, outputDirectory:path.join(rootDir,jsonDirectory)} );
        });

        app.get('/', function(req, res){
            //console.log(req);
            var retData = JSON.parse(fs.readFileSync(path.join(rootDir,jsonDirectory, "rootIndex.json"), 'utf8'));
            res.render(path.join(views,"index"),{results: retData, outputDirectory:path.join(rootDir,jsonDirectory)} );

        });

        http.createServer(app).listen(app.get('port'), function(){
            console.log();
            console.log('Express server listening on port ' + app.get('port'));
        });
    }
}