var util = require('util')
  , http = require('http')
  , querystring = require('querystring')
  , app = require('../app')
  , utils = require('../utils/utils')
  , events = require('events')
  , agg = require('./aggregation')
  , CacheRedis = require('../managers/cache-redis').CacheRedis;

function SensorTrigger(sensorClass, configClass) {
  this.sensorClass = sensorClass || {'entityName': 'sensor'};
  this.configClass = configClass || {'entityName': 'config'};
  this.cache = new CacheRedis(app.redisClient, app.logmessage);

  events.EventEmitter.call(this);
}

util.inherits(SensorTrigger, events.EventEmitter);

SensorTrigger.prototype.getSensorConfig = function(sensor, trigger) {
  var that = this
    , sensorKeyId = that.sensorClass.entityName + ':' + sensor
    , baseKeyId = "base";

  that.trigger = trigger;
  that.id = sensor;

  var callBack = function (config) {
    config = utils.deepen(config);
    that.receiver = config.receiver;
    that.config = config.triggers[that.trigger];
    that.emit(that.config.data, sensor);
  }

  that.cache.getItem(that.configClass, sensorKeyId, function(err, config) {
    if (!config) {
      that.cache.getItem(that.configClass, baseKeyId, function(err, config) {
        callBack(config);
      })
    } else {
      callBack(config);
    } 
  })
}

SensorTrigger.prototype.getAllData = function(sensor) {
  var that = this;

  that.cache.getAllData(that.sensorClass, sensor, function(err, data) {
    if (err) {
      that.emit("error", err);
    } else {
      that.emit(that.config.aggregation, data); 
    }
  })
}

SensorTrigger.prototype.getNewData = function(sensor) {
  var that = this;

  that.cache.getNewData(that.sensorClass, sensor, function(err, data) {
    if (err) {
      that.emit("error", err);
    } else {
      that.emit(that.config.aggregation, data); 
    }
  })
}

SensorTrigger.prototype.getMaxData = function(data) {
  var that = this;

  agg.aggregate(data, agg.max, function(res){
    that.emit(that.config.trigger, data, res);
  })
}

SensorTrigger.prototype.getSumData = function(data) {
  var that = this;

  agg.aggregate(data, agg.sum, function(res){
    that.emit(that.config.trigger, data, res);
  })
}

SensorTrigger.prototype.threshold = function(data, res) {
  var that = this
    , threshold = that.config.threshold;

  if (threshold < res) {
    that.emit("sendData", data);
  }
}

SensorTrigger.prototype.sendData = function(data) {
  var that = this
    , receiver = that.receiver
    , postData = querystring.stringify({
        id: that.id,
        data: data 
      });

  var options = {
      host: receiver.host,
      port: receiver.port,
      path: receiver.path,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length
      }
  };

  var req = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log("body: " + chunk);
      });
  });

  req.write(postData);
  req.end();

}

trigger = new SensorTrigger();

trigger.on("onNewData", trigger.getSensorConfig); 
trigger.on("scheduling", trigger.getSensorConfig); 
trigger.on("onNewUser", trigger.getSensorConfig); 

trigger.on("all", trigger.getAllData);
trigger.on("new", trigger.getNewData);
trigger.on("max", trigger.getMaxData);
trigger.on("sum", trigger.getSumData);
trigger.on("threshold", trigger.threshold);
trigger.on("sendData", trigger.sendData);

module.exports = trigger;
