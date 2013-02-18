
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , redis = require('redis');

var common = require('./config/common')
  , config = common.config()
  , CFG_SERVER = config.server
  , CFG_STORE_REDIS = config.storeRedis
  , port = process.env.PORT || CFG_SERVER.port 
  , forks = process.env.FORKS || CFG_SERVER.forks;

var app = express();
// our catcher for log messages
process.addListener('uncaughtException', function (err, stack) {
  var message = 'Caught exception: ' + err + '\n' + err.stack;
  if (app && app.logmessage) {
    app.logmessage(message);
  } else {
    console.log(message);
  }
});

// basically a wrapper around logger
var logmessage = function(message) {
  message = '#' + (process.env.NODE_WORKER_ID ? process.env.NODE_WORKER_ID : 'M') + ': ' + message;
  console.log(message);
}

// all environments
app.set('port', port);
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

// Start redis connection
app.redisClient = redis.createClient(
  CFG_STORE_REDIS.port, 
  CFG_STORE_REDIS.host
)
app.redisClient.select(CFG_STORE_REDIS.dbname);

// Add other stuff to app
app.envConfig = config;
app.logmessage = logmessage;
module.exports = app;


// here we load de routes 
var sensor = require('./routes/sensor')
  , site = require('./routes/site');

// General
app.get('/', site.index);

// Api
app.get('/sensors/:id', sensor.get);
app.get('/sensors', sensor.search);
app.post('/sensors', sensor.post);
app.get('/sensors/:id/data', sensor.getData);
app.post('/sensors/:id/data', sensor.postData);

http.createServer(app).listen(port, function(){
  console.log("Express server listening on port " + port + ' in "' + app.settings.env + '" mode');
});

