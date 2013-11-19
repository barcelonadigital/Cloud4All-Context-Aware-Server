
'use strict';

var util = require('util'),
  http = require('http'),
  events = require('events'),
  _ = require('underscore'),
  app = require('../app'),
  utils = require('../utils/utils'),
  agg = require('../utils/aggregation'),
  Config = require('../models/configs').Config,
  Data = require('../models/devices').Data,
  User = require('../models/users').User,
  CacheRedis = require('../managers/cache-redis').CacheRedis;

function SensorTrigger(sensor) {
  this.sensorClass = app.envConfig.sensorClass;
  this.channels = app.envConfig.channels;
  this.cache = new CacheRedis(app.redisClient, app.logmessage);
  this.sensor = sensor;

  this.on('onNewData', function () {
    this.getSensorConfig('onNewData');
  });

  this.on('scheduling', function () {
    this.getSensorConfig('scheduling');
  });

  this.on('getAllData', this.getAllData);
  this.on('getNewData', this.getNewData);
  this.on('getMaxData', this.getMaxData);
  this.on('getSumData', this.getSumData);
  this.on('getLastData', this.getLastData);
  this.on('threshold', this.threshold);
  this.on('diffRadius', this.diffRadius);
  this.on('getNearUsers', this.getNearUsers);
  this.on('publishData', this.publishData);
  this.on('sendData', this.sendData);
  this.on('sendProfile', this.sendProfile);
  this.on('storeData', this.storeData);


  events.EventEmitter.call(this);
}

util.inherits(SensorTrigger, events.EventEmitter);

SensorTrigger.prototype.getSensorConfig = function (trigger) {
  var that = this;

  trigger = trigger || 'onNewData';

  Config.findByRef(that.sensor.id, function (err, item) {
    that.receiver = item.config.receiver;
    that.config = item.config.triggers[trigger];
    that.on(that.config.onTriggered, that.publishTrigger);

    that.emit(that.config.onConfig);

  });
};

SensorTrigger.prototype.getAllData = function () {
  var that = this;

  that.cache.getAllData(that.sensorClass, that.sensor.id, function (err, data) {
    if (err) {
      that.emit('error', err);
    } else {
      that.data = data;
      that.emit(that.config.onData);
    }
  });
};

SensorTrigger.prototype.getNewData = function () {
  var that = this;

  that.cache.getNewData(that.sensorClass, that.sensor.id, function (err, data) {
    if (err) {
      that.emit('error', err);
    } else {
      that.data = data;
      that.emit(that.config.onData);
    }
  });
};

SensorTrigger.prototype.getMaxData = function () {
  var that = this;

  agg.aggregate(that.data, agg.max, function (res) {
    that.result = res;
    that.emit(that.config.onAggregated);
  });
};

SensorTrigger.prototype.getSumData = function () {
  var that = this;

  agg.aggregate(that.data, agg.sum, function (res) {
    that.result = res;
    that.emit(that.config.onAggregated);
  });
};

SensorTrigger.prototype.getLastData = function () {
  var that = this;

  agg.aggregate(that.data, agg.last, function (res) {
    that.result = res;
    that.emit(that.config.onAggregated);
  });
};

SensorTrigger.prototype.threshold = function () {
  var that = this,
    threshold = that.config.threshold || '0';

  if (threshold < that.result.value) {
    that.emit(that.config.onTriggered);
  } else {
    that.emit('nonTriggered');
  }
};

SensorTrigger.prototype.diffRadius = function () {
  var that = this,
    threshold = that.config.diffRadius || '10',
    topThreshold = 1 + threshold / 100,
    bottomThreshold = 1 - threshold / 100;

  Data.getLast(that.sensor.id, function (err, reply) {
    if (reply) {
      var last = reply[0].value,
        actual = that.result.value;

      if (actual < bottomThreshold * last || actual > topThreshold * last) {
        that.emit(that.config.onTriggered);
      } else {
        that.emit('nonTriggered');
      }
    } else if (err) {
      that.emit('error', err);
    } else {
      that.emit('nonTriggered');
    }
  });
};

SensorTrigger.prototype.getNearUsers = function () {
  var that = this,
    near,
    maxDistance = that.config.maxDistance || 1;

  that.sensor.getDevice(function (err, device) {
    if (err) {
      that.emit('error', err);
    } else if (!device) {
      that.emit('error', new Error('device not found'));
    } else if (!device.gps) {
      that.emit('error', new Error('device gps not found'));
    } else {
      User.findNear({gps: device.gps, maxDistance: maxDistance}, function (err, users) {
        if (users) {
          that.users = users;
          that.emit(that.config.onNearby);
        } else if (err) {
          that.emit('error', err);
        } else {
          that.emit('notNear');
        }
      });
    }
  });
};
        
SensorTrigger.prototype.sendRequest = function (postData) {
  var that = this,
    receiver = that.receiver,
    data = JSON.stringify(postData),
    options = {
      host: receiver.host,
      port: receiver.port,
      path: receiver.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

  var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      that.emit(that.config.onSent, chunk, that.config);
    });
  });

  req.write(data);
  req.end();
};

SensorTrigger.prototype.sendProfile = function () {
  this.sendRequest(this.users);
};

SensorTrigger.prototype.sendData = function () {
  this.sendRequest({
    id: this.sensor.id,
    data: this.data
  });
};

SensorTrigger.prototype.publishData = function () {
  app.pub.publish("data." + this.sensor.id, JSON.stringify(this.data));
  this.emit(this.config.onPublished);
};

SensorTrigger.prototype.publishTrigger = function () {
  var el = {
    first: _.first(this.data).at,
    last: _.last(this.data).at,
    config: this.config
  };
  app.pub.publish("trigger." + this.sensor.id, JSON.stringify(el));
};

SensorTrigger.prototype.storeData = function () {
  // store data to mongodb
  var that = this,
    mongoSeries = [],
    i;

  mongoSeries = that.data.map(function (el) {
    return {
      '_sensor': that.sensor.id,
      'at': el.at,
      'value': el.value
    };
  });

  Data.create(mongoSeries, function (err) {
    if (err) {
      that.emit('error', err);
    } else {
      that.emit(that.config.onStored);
    }
  });
};

module.exports.SensorTrigger = SensorTrigger;
