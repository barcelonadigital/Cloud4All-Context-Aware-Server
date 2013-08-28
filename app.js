
/**
 * Module dependencies.
 */

var express = require('express'),
  http = require('http'),
  path = require('path'),
  redis = require('redis'),
  mongoose = require('mongoose');

var common = require('./config/common'),
  envConfig = common.config(),
  CFG_SERVER = envConfig.server,
  CFG_STORE_REDIS = envConfig.storeRedis,
  CFG_STORE_MONGO = envConfig.storeMongo,
  port = process.env.PORT || CFG_SERVER.port,
  forks = process.env.FORKS || CFG_SERVER.forks;

var app = express(),
  server = http.createServer(app),
  io = require('socket.io').listen(server);

// all environments
app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express["static"](path.join(__dirname, 'public')));
app.use(app.router);


// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

// testing only
if ('test' === app.get('env')) {
  app.use(express.errorHandler());
}

// testing and development only
if ('test' === app.get('env') || 'development' === app.get('env')) {
  var receiver = require('./controllers/receiver'),
    testPort = envConfig.receiver.port;

  // Api: post from CAS - testing purposes
  app.post('/receiver', receiver.post);

  http.createServer(app).listen(testPort, function () {
    console.log("Test server listening on port " + testPort + ' in "' + app.settings.env + '" mode');
  });
}

// Start redis connection
app.redisClient = redis.createClient(
  CFG_STORE_REDIS.port,
  CFG_STORE_REDIS.host
);
app.redisClient.select(CFG_STORE_REDIS.dbname);

// Start redis pub/sub connection
app.pub = redis.createClient(
  CFG_STORE_REDIS.port,
  CFG_STORE_REDIS.host
);
app.pub.select(CFG_STORE_REDIS.dbname);

// Start redis pub/sub connection
app.sub = redis.createClient(
  CFG_STORE_REDIS.port,
  CFG_STORE_REDIS.host
);
app.sub.select(CFG_STORE_REDIS.dbname);

// Start mongodb connection
app.mongoClient = mongoose.connect(
  CFG_STORE_MONGO.host,
  CFG_STORE_MONGO.dbname
);

// Add other stuff to app
app.envConfig = envConfig;
app.logmessage = console.log;
module.exports = app;

// Bootstrap routes
require('./config/routes')(app);

// Socket.io connection
require('./controllers/socket')(app, io);

server.listen(app.get('port'), function () {
  console.log("Server listening on port " + app.get('port') + ' in "' + app.settings.env + '" mode');
});

