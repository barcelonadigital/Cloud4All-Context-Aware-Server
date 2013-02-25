
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , redis = require('redis');

var common = require('./config/common')
  , envConfig = common.config()
  , CFG_SERVER = envConfig.server
  , CFG_STORE_REDIS = envConfig.storeRedis
  , port = process.env.PORT || CFG_SERVER.port 
  , forks = process.env.FORKS || CFG_SERVER.forks;

var app = express();

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

// testing only 
if ('test' == app.get('env')) {
  app.use(express.errorHandler());
}

// Start redis connection
app.redisClient = redis.createClient(
  CFG_STORE_REDIS.port, 
  CFG_STORE_REDIS.host
)
app.redisClient.select(CFG_STORE_REDIS.dbname);

// Add other stuff to app
app.envConfig = envConfig;
app.logmessage = console.log;
module.exports = app;

// here we load de routes 
var sensor = require('./routes/sensor')
  , config = require('./routes/config')
  , site = require('./routes/site');

// General
app.get('/', site.index);

// Api:sensors
app.get('/sensors/:id', sensor.get);
app.get('/sensors', sensor.search);
app.get('/sensors/:id/data', sensor.getData);
app.post('/sensors', sensor.post);
app.post('/sensors/:id', sensor.update);
app.post('/sensors/:id/data', sensor.postData);

// Api:config
app.get('/configs/:id', config.get);
app.get('/configs/:id/:key', config.getValue);
app.post('/configs', config.post);
app.post('/configs/:id', config.update);
app.post('/configs/:id/:key', config.updateValue);

http.createServer(app).listen(port, function(){
  console.log("Express server listening on port " + port + ' in "' + app.settings.env + '" mode');
});

