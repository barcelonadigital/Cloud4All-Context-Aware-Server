/**
 * Configuration System API routes.

 config = {
  'id': 'base',
  'triggers.onNewData.data': 'raw',
  'triggers.onNewData.threshold': '10',
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
  , configClass = {'entityName': 'config'};


exports.get = function (req, res, next) {
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

exports.post = function (req, res, next) {
  /**
   * Creates a config system 
  **/
  var item = req.body;
  item.id = item.id || "base";

  cache.postItem(configClass, item, function (err, item) {
    if (err) {
      next(err);
    } else {
      res.send(item);
    }
  })
}

exports.update = function (req, res, next) {
  /**
   * Updates a config system 
  **/
  var item = req.body
    , id = req.params.id;

  cache.updateItem(configClass, item, id, function (err, item) {
    if (err) {
      next(err);
    } else {
      res.send(item);
    }
  })
}

exports.getValue = function (req, res, next) {
  /**
   * Gets the value parameter from key's parameter and config id
  **/
  var key = req.params.key
    , id = req.params.id
    , result = {};

  cache.getHashItem(configClass, id, key, function (err, item){
    if (err) {
      next(err);
    } else if (item) {
      result[key] = item;
      res.send(result);
    } else {
      res.send(404);
    }
  })
}

exports.updateValue = function (req, res, next) {
  /**
   * Put value to key parameter and config id. If parameter does
   * not exists, returns error.
  **/
  var key = req.params.key
    , id = req.params.id
    , value = req.body[key]
    , result = {}; 

  cache.updateHashItem(configClass, id, key, value, function (err, item){
    if (err) {
      next(err);
    } else {
      result[key] = item;
      res.send(result);
    }
  })
}
