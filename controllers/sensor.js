/**
 * Sensor API routes.
**/


var app = require('../app') 
  , trigger = require('../triggers/sensor-trigger')
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(
      app.redisClient, 
      app.logmessage)
  , sensorClass= {'entityName': 'sensor'}
  , Sensor = require("../models/devices").Sensor;


exports.postData = function (req, res) {
  /**
   * Posts new data from sensor id
  **/
  var id = req.params.id
    , data = req.body
    , e = new trigger.SensorTrigger();

  cache.postData(sensorClass, id, data, function (err){
    if (err) {
      next(err);
    } else {
      e.emit("onNewData", id, "onNewData");  
      res.send(); 
    }
  })
}

exports.getData = function (req, res) {
  /**
   * Gets all data from sensor id
  **/
  var id = req.params.id
    , query = req.query.q || "all"
    , getData = null;    

  switch(query) {
    case "all": cache.get = cache.getAllData; break;
    case "new": cache.get = cache.getNewData; break;
    default: getData = function () {
      res.send(new Error("Incorrect query parameter " + query))
    };
  }

  cache.get(sensorClass, id, function (err, reply) {
    if (err) {
      next(err);
    } else {
      res.send({data: reply});
    }
  })
}
