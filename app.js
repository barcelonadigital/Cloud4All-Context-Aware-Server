
/**
 * Module dependencies.
 */

var express = require('express')
  , site = require('./routes/site')
  , sensor = require('./routes/sensor')
  , http = require('http')
  , path = require('path')

var app = express();
module.exports = app;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only 
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// General
app.get('/', site.index);

// Api
app.get('/sensors/:id', sensor.getSensor, sensor.get);
app.post('/sensors', sensor.post);
app.get('/sensors/:id/data', sensor.getSensor, sensor.getData);
app.post('/sensors/:id/data', sensor.getSensor, sensor.postData);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
