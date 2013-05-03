var util = require('util')
  , http = require('http')
  , querystring = require('querystring')
  , events = require('events')
  , app = require('../app')
  , utils = require('../utils/utils')
  , agg = require('../utils/aggregation')
  , Config = require('../models/configs').Config
  , Data = require('../models/devices').Data
  , CacheRedis = require('../managers/cache-redis').CacheRedis;

function SensorTrigger(sensorClass, configClass) {
  this.sensorClass = sensorClass || {'entityName': 'sensor'};
  this.dataKey = "sent-data";
  this.cache = new CacheRedis(app.redisClient, app.logmessage);

  this.on("onNewData", this.getSensorConfig); 
  this.on("scheduling", this.getSensorConfig); 
  this.on("onNewUser", this.getSensorConfig); 

  this.on("all", this.getAllData);
  this.on("new", this.getNewData);
  this.on("max", this.getMaxData);
  this.on("sum", this.getSumData);
  this.on("last", this.getLastData);
  this.on("threshold", this.threshold);
  this.on("diffRadius", this.diffRadius);
  this.on("send", this.sendData);
  this.on("store", this.storeData);

  events.EventEmitter.call(this);
}

util.inherits(SensorTrigger, events.EventEmitter);

SensorTrigger.prototype.getSensorConfig = function (sensorId, trigger) {
  var that = this
    , sensorKeyId = that.sensorClass.entityName + ':' + sensorId
    , baseKeyId = "base";

  that.trigger = trigger || "onNewData";
  that.id = sensorId;

  Config.findByRef(that.id, function (err, item) {
    that.receiver = item.config.receiver;
    that.config = item.config.triggers[that.trigger];
    that.emit(that.config.data, sensorId);
  })
}

SensorTrigger.prototype.getAllData = function (sensorId) {
  var that = this;

  that.cache.getAllData(that.sensorClass, sensorId, function (err, data) {
    if (err) {
      that.emit("error", err);
    } else {
      that.emit(that.config.aggregation, data); 
    }
  })
}

SensorTrigger.prototype.getNewData = function (sensorId) {
  var that = this;

  that.cache.getNewData(that.sensorClass, sensorId, function (err, data) {
    if (err) {
      that.emit("error", err);
    } else {
      that.emit(that.config.aggregation, data); 
    }
  })
}

SensorTrigger.prototype.getMaxData = function (data) {
  var that = this;

  agg.aggregate(data, agg.max, function (res){
    that.emit(that.config.trigger, data, res);
  })
}

SensorTrigger.prototype.getSumData = function (data) {
  var that = this;

  agg.aggregate(data, agg.sum, function (res){
    that.emit(that.config.trigger, data, res);
  })
}

SensorTrigger.prototype.getLastData = function (data) {
  var that = this;

  agg.aggregate(data, agg.last, function (res){
    that.emit(that.config.trigger, data, res);
  })
}

SensorTrigger.prototype.threshold = function (data, res) {
  var that = this
    , threshold = that.config.threshold || "0";

  if (threshold < res[1]) {
    that.emit(that.config.triggered, data);
  } else {
    that.emit("nonTriggered", threshold, res, data);
  }
}

SensorTrigger.prototype.diffRadius = function (data, res) {
  var that = this
    , last = res
    , threshold = that.config.diffRadius || "10"
    , topThreshold = 1 + threshold / 100
    , bottomThreshold = 1 - threshold / 100;

  Data.getLast(that.id, function(err, reply) {
    if (reply) {
      var res = [reply[0].timestamp, reply[0].data];
      if (last[1] < bottomThreshold * res[1] || last[1] > topThreshold * res[1]) {
        that.emit(that.config.triggered, last);
      } else {
        that.emit("nonTriggered", threshold, res, last);
      }
    } else if (err) {
      that.emit("error", err);
    }
  })
}

SensorTrigger.prototype.sendData = function (data) {
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

  var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      that.emit(that.config.send, data);
    });
  });

  req.write(postData);
  req.end();
}

SensorTrigger.prototype.storeData = function (data) {
  // store data to mongodb
  var that = this
    , dataSeries = data instanceof Array ? data : data.split(',')
    , mongoSeries = [];

  dataSeries = dataSeries.map(parseFloat);

  for (var i = 0; i < dataSeries.length; i+=2) {
    mongoSeries.push({
      '_sensor': that.id,
      'timestamp': dataSeries[i], 
      'data': dataSeries[i+1]
    })
  }

  Data.create(mongoSeries, function (err) {
    if (err) {
      that.emit("error", err);
    } else {
      that.emit(that.config.store);
    }
  })
}

module.exports.SensorTrigger = SensorTrigger;
