
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

// testing and development only
if ('test' || 'development' == app.get('env')) {
  var receiver = require('./routes/receiver')
    , testPort = envConfig.receiver.port;

  // Api: post from CAS - testing purposes
  app.post('/receiver', receiver.post);

  http.createServer(app).listen(testPort, function(){
  console.log("Test server listening on port " + testPort + ' in "' + app.settings.env + '" mode');
  });
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

// Bootstrap routes
require('./config/routes')(app)

http.createServer(app).listen(port, function(){
  console.log("Server listening on port " + port + ' in "' + app.settings.env + '" mode');
});

