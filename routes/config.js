/**
 * Configuration System API routes.

 config = {
  'id': 'devel',
  'triggers.on-new-data.data': 'raw',
  'triggers.on-new-data.threshold': '10',
  'triggers.scheduler.data': 'mean',
  'triggers.scheduler.time': '60',
  'client.url': 'http://flowmanager/data',
 }
**/


var app = require('../app') 
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(
      app.redisClient, 
      app.logmessage)
  , configClass= {'entityName': 'config'};


exports.get = function(req, res, next) {
  /**
   * Get a config json from Redis database
  **/
  var id = req.params.id;

  cache.getItem(configClass, id, function (err, item){
    if (err) {
      next(err);
    } else if (item) {
      res.send(item);
    } else {
      res.send(404);
    }
  })
}

exports.post = function(req, res, next) {
  /**
   * Post or update the id config system 
  **/
  var item = req.body;
  cache.postItem(configClass, item, function (err, item) {
    if (err) {
      next(err);
    } else {
      res.send(200);
    }
  })
}

exports.getConfigItem = function(req, res, next) {
  /**
   * Get the value parameter from key's parameter and config id
  **/
  var id = req.params.id;
  var key = req.params.key;

  cache.getItem(configClass, id, function (err, item){
    if (err) {
      next(err);
    } else if (item) {
      cache.getItem(configClass)
    } else {
      res.send(404);
    }
  })
}

exports.postConfigItem = function(req, res, next) {
  /**
   * Put value to key parameter and config id. If parameter does
   * not exists, returns error.
  **/
  var id = req.params.id;
  var key = req.params.key;

  cache.getItem(configClass, id, function (err, item){
    if (err) {
      next(err);
    } else if (item) {
      cache.getItem(configClass)
    } else {
      res.send(404);
    }
  })
}
