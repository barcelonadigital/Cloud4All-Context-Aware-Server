var util = require("util")
  , http = require('http')
  , app = require('../app')
  , events = require("events")
  , agg = require('./aggregation')
  , CacheRedis = require('../managers/cache-redis').CacheRedis;

function SensorTrigger(sensorClass, configClass) {
  this.sensorClass = sensorClass || {'entityName': 'sensor'};
  this.configClass = configClass || {'entityName': 'config'};
  this.cache = new CacheRedis(app.redisClient, app.logmessage);

  events.EventEmitter.call(this);
}

util.inherits(SensorTrigger, events.EventEmitter);

SensorTrigger.prototype.newData = function(sensor) {
    this.emit("new-data", sensor);
}

SensorTrigger.prototype.newSensor = function(sensor) {
    this.emit("new-sensor", sensor);
}

SensorTrigger.prototype.getConfig = function(sensor) {
  var that = this
    , sensorKeyId = that.sensorClass.entityName + ':' + sensor;

  that.cache.getItem(that.configClass, sensorKeyId, function(err, config) {
    that.emit("get-config", sensor, config);
  })
}

SensorTrigger.prototype.getData = function(sensor, config) {
  var that = this;
}

trigger = new SensorTrigger();

trigger.on("new-data", trigger.getConfig); 
trigger.on("get-config", trigger.getData);
//trigger.on("get-data", trigger.aggregateData);
//trigger.on("agg-data", trigger.triggerData);
//trigger.on("trigger-data", trigger.sendData);

module.exports = trigger;

