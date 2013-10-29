
"use strict";

var util = require('util'),
  http = require('http'),
  async = require('async'),
  querystring = require('querystring'),
  events = require('events'),
  app = require('../app'),
  trigger = require('../triggers/sensor-trigger'),
  utils = require('../utils/utils'),
  agg = require('../utils/aggregation'),
  User = require('../models/users').User,
  Device = require('../models/devices').Device,
  Config = require('../models/configs').Config,
  CacheRedis = require('../managers/cache-redis').CacheRedis;


function UserTrigger(user) {
  this.sensorClass = app.envConfig.sensorClass;
  this.cache = new CacheRedis(app.redisClient, app.logmessage);
  this.user = user;
  this.sensors = [];
  this.data = [];

  this.on('onNewUser', this.getUserConfig, 'onNewUser');
  this.on('getNearSensors', this.getNearSensors);
  this.on('getLastData', this.getLastData);
  this.on('sendProfile', this.sendProfile);


  events.EventEmitter.call(this);
}

util.inherits(UserTrigger, events.EventEmitter);

UserTrigger.prototype.getUserConfig = function (trigger) {
  var that = this;

  trigger = trigger || 'onNewUser';

  Config.findByRef(that.user.id, function (err, item) {
    that.receiver = item.config.receiver;
    that.config = item.config.triggers[trigger];
    that.emit(that.config.onConfig);
  });
};

UserTrigger.prototype.getNearSensors = function () {
  var that = this,
    maxDistance = that.config.maxDistance || 1;

  Device.findNear({gps: that.user.gps, maxDistance: maxDistance}, function (err, devices) {
    if (devices) {
      devices.forEach(function (device) {
        that.sensors = that.sensors.concat(device.sensors);
      });
      that.emit(that.config.onNearby);
    } else if (err) {
      that.emit('error', err);
    } else {
      that.emit('notNear');
    }
  });
};

UserTrigger.prototype.getLastData = function () {
  var that = this,
    end = Date.now(),
    start = end - that.config.maxTime;

  var getSensor = function (sensor, cb) {
    that.cache.getScoreData(that.sensorClass, sensor, start, end, function (err, data) {
      if (data.length > 0) {
        that.data.push({'sensor': sensor, 'data': data});
      }
      cb(err);
    });
  };

  async.each(this.sensors, getSensor, function (err) {
    if (err) {
      that.emit('error', err);
    } else if (that.data.length > 0) {
      that.emit(that.config.onData);
    } else {
      that.emit('noData');
    }
  });
};

UserTrigger.prototype.sendRequest = function (postData) {
  var that = this,
    data = JSON.stringify(postData),
    receiver = that.receiver,
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

UserTrigger.prototype.sendProfile = function () {
  this.sendRequest({
    uuid: this.user.uuid,
    profile: this.user.profile,
    context: this.data
  });
};

module.exports.UserTrigger = UserTrigger;
