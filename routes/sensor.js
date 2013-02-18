/**
 * Sensor API routes.

 sensor = {
  'gps': [111,222,333],
  'type': 'light',
  'id':1,
  'uuid': '550e8400-e29b-41d4-a716-446655440000',
  'data': ["1,2,3,4,5,6", "1,2,3,4,5,6"]
 }
**/


var app = require('../app') 
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(
      app.redisClient, 
      app.logmessage)
  , sensorClass= {'entityName': 'sensor'};

exports.get = function(req, res, next) {
  /**
   * Get sensor from Redis database
  **/
  var id = req.params.id;

  cache.getItem(sensorClass, id, function (err, item){
    if (err) {
      next(err);
    } else if (item) {
      res.send(item);
    } else {
      res.send(404);
    }
  })
}

exports.search = function(req, res, next) {
  /**
   * Get sensor from query search 
  **/
  var query = req.query;
  var uuid = query['uuid'] || null;
  if (uuid) {
    cache.getItemFromUuid(sensorClass, uuid, function (err, item) {
      if (err) {
        next(err);
      } else if (item) {
        res.send(item);
      } else {
        res.send(404);
      }
    }) 
  } else {
    res.send(404);
  }
}

exports.post = function(req, res, next) {
  /**
   * Post or update sensor 
  **/
  var item = req.body;
  cache.postItem(sensorClass, item, function (err, item) {
    if (err) {
      next(err);
    } else {
      res.send(200);
    }
  })
}

exports.postData = function(req, res) {
  /**
   * Post new data from sensor id
  **/
  var id = req.params.id;
  var data = req.body;

  cache.postData(sensorClass, id, data, function(err){
    if (err) {
      next(err);
    } else {
      res.send(200); 
    }
  })
}

exports.getData = function(req, res) {
  /**
   * Get all data from sensor id
  **/
  var id = req.params.id;
  cache.getData(sensorClass, id, function(err, reply) {
    if (err) {
      next(err);
    } else {
      res.send(200, {data: reply.join(',')});
    }
  })
}
