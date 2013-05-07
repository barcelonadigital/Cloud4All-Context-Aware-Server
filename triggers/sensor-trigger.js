var util = require('util')
  , http = require('http')
  , querystring = require('querystring')
  , events = require('events')
  , app = require('../app')
  , utils = require('../utils/utils')
  , agg = require('../utils/aggregation')
  , Config = require('../models/configs').Config
  , Data = require('../models/devices').Data
  , User = require('../models/users').User
  , CacheRedis = require('../managers/cache-redis').CacheRedis;

function SensorTrigger(sensor) {
  this.sensorClass = {'entityName': 'sensor'};
  this.dataKey = "sent-data";
  this.cache = new CacheRedis(app.redisClient, app.logmessage);
  this.sensor = sensor;

  this.on("onNewData", this.getSensorConfig); 
  this.on("scheduling", this.getSensorConfig); 

  this.on("all", this.getAllData);
  this.on("new", this.getNewData);
  this.on("max", this.getMaxData);
  this.on("sum", this.getSumData);
  this.on("last", this.getLastData);
  this.on("threshold", this.threshold);
  this.on("diffRadius", this.diffRadius);
  this.on("near", this.nearbyUsers);
  this.on("send", this.sendData);
  this.on("store", this.storeData);

  events.EventEmitter.call(this);
}

util.inherits(SensorTrigger, events.EventEmitter);

SensorTrigger.prototype.getSensorConfig = function () {
  var that = this
    , sensorKeyId = that.sensorClass.entityName + ':' + that.sensor.id 
    , baseKeyId = "base"
    , trigger = "onNewData";

  Config.findByRef(that.sensor.id, function (err, item) {
    that.receiver = item.config.receiver;
    that.config = item.config.triggers[trigger];
    that.emit(that.config.data);
  })
}

SensorTrigger.prototype.getAllData = function () {
  var that = this;

  that.cache.getAllData(that.sensorClass, that.sensor.id, function (err, data) {
    if (err) {
      that.emit("error", err);
    } else {
      that.data = data;
      that.emit(that.config.aggregation); 
    }
  })
}

SensorTrigger.prototype.getNewData = function () {
  var that = this;

  that.cache.getNewData(that.sensorClass, that.sensor.id, function (err, data) {
    if (err) {
      that.emit("error", err);
    } else {
      that.data = data;
      that.emit(that.config.aggregation); 
    }
  })
}

SensorTrigger.prototype.getMaxData = function () {
  var that = this;

  agg.aggregate(that.data, agg.max, function (res) {
    that.result = res;
    that.emit(that.config.trigger);
  })
}

SensorTrigger.prototype.getSumData = function () {
  var that = this;

  agg.aggregate(that.data, agg.sum, function (res) {
    that.result = res; 
    that.emit(that.config.trigger);
  })
}

SensorTrigger.prototype.getLastData = function () {
  var that = this;

  agg.aggregate(that.data, agg.last, function (res) {
    that.result = res;
    that.emit(that.config.trigger);
  })
}

SensorTrigger.prototype.threshold = function () {
  var that = this
    , threshold = that.config.threshold || "0";

  if (threshold < that.result[1]) {
    that.emit(that.config.triggered);
  } else {
    that.emit("nonTriggered");
  }
}

SensorTrigger.prototype.diffRadius = function () {
  var that = this
    , threshold = that.config.diffRadius || "10"
    , topThreshold = 1 + threshold / 100
    , bottomThreshold = 1 - threshold / 100;

  Data.getLast(that.sensor.id, function(err, reply) {
    if (reply) {
      var last = reply[0].data
        , actual = that.result[1];

      if (actual < bottomThreshold * last || actual > topThreshold * last) {
        that.emit(that.config.triggered);
      } else {
        that.emit("nonTriggered");
      }
    } else if (err) {
      that.emit("error", err);
    }
  })
}

SensorTrigger.prototype.nearbyUsers = function () {
  var that = this
    , near
    , maxDistance = that.config.maxDistance || 1

  that.sensor.getDevice(function (err, device) {
    if (err) {
      that.emit("error", err);
    } else {
      User.findNear({gps: device.gps, maxDistance: maxDistance}, function (err, users) {
        if (users) {
          that.users = users;
          that.emit(that.config.isNear);
        } else if (err) {
          that.emit("error", err);
        } else {
          that.emit("notNear");
        }
      })
    }
  })
}

SensorTrigger.prototype.sendRequest = function (postData) {
  var that = this
    , receiver = that.receiver
    , options = {
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
      that.emit(that.config.send, chunk);
    })
  })

  req.write(postData);
  req.end();
}

SensorTrigger.prototype.sendProfile = function () {
  var that = this
    , receiver = that.receiver
    , postData = querystring.stringify({});

  that.sendRequest(postData);
}

SensorTrigger.prototype.sendData = function () {
  var that = this
    , receiver = that.receiver
    , postData = querystring.stringify({
        id: that.sensor.id,
        data: that.data 
      });

  that.sendRequest(postData);
}

SensorTrigger.prototype.storeData = function () {
  // store data to mongodb
  var that = this
    , dataSeries = that.data instanceof Array ? that.data : that.data.split(',')
    , mongoSeries = [];

  dataSeries = dataSeries.map(parseFloat);

  for (var i = 0; i < dataSeries.length; i += 2) {
    mongoSeries.push({
      '_sensor': that.sensor.id,
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
