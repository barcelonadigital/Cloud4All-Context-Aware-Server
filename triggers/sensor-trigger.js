
'use strict';

var util = require('util'),
  http = require('http'),
  url = require('url'),
  events = require('events'),
  _ = require('underscore'),
  app = require('../app'),
  utils = require('../utils/utils'),
  agg = require('../utils/aggregation'),
  Config = require('../models/configs').Config,
  Data = require('../models/devices').Data,
  User = require('../models/users').User,
  Trigger = require('../models/triggers').Trigger,
  TriggerHistory = require('../models/triggers').TriggerHistory;

function SensorTrigger(sensor) {
  var that = this;

  this.sensorClass = app.envConfig.sensorClass;
  this.channels = app.envConfig.channels;
  this.data = [];
  this.triggers = [];
  this.fired = [];
  this.sensor = sensor;

  this.on('onNewData', function (data) {
    that.data = data; that.getSensorConfig('onNewData'); });

  this.on('scheduling', function () {
    that.getSensorConfig('scheduling');
  });

  this.on('getTriggers', this.getSensorTriggers);
  this.on('trigger', this.trigger);
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

SensorTrigger.prototype.getSensorTriggers = function () {
  var that = this;

  this.triggers = [];

  Trigger.findByRef(that.sensor.id, function (err, items) {
    that.triggers = items;
    that.emit(that.config.onTriggers);
  });
};
SensorTrigger.prototype.trigger = function () {
  var that = this,
    i = 0,
    last = null;

  /* for each new data check every trigger and if fired
   * store it to fired
  */

  this.fired = [];

  var callback = function () {
    that.data.forEach(function (el, ind) {
      that.triggers.forEach(function (trigger) {
        var threshold = trigger.threshold,
          triggered = false,
          changed = false,
          top = 1 + threshold / 100,
          bottom = 1 - threshold / 100,
          actual = el.value;

        if (trigger.type == 'threshold') {
          triggered = utils.compare(trigger.operator, actual, threshold);
        } else if (trigger.type == 'radius') {
          triggered = (last == null) ? false : actual < bottom * last || actual > top * last;
          last = actual;
        }

        if (triggered && !trigger.triggered) {
          that.fired.push({
            at: el.at,
            value: el.value,
            trigger: trigger
          });
        }
        trigger.triggered = triggered;
      });
    });

    if (that.fired.length > 0) {
      // TODO: save triggers
      that.emit(that.config.onTriggered);
    } else {
      that.emit(that.config.onNonTriggered);
    }
  };

  if (that.triggers.filter(function (el) {return el.trigger == 'radius'}).length > 0) {
    Data.getLast(that.sensor.id, function (err, reply) {
      last = reply ? reply.value : null;
      callback();
    }); 
  } else {
    callback();
  }
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
          that.emit(that.config.onNotNear);
        }
      });
    }
  });
};
        
SensorTrigger.prototype.sendRequest = function (postData, sender) {
  var that = this,
    receiver = that.receiver,
    data = JSON.stringify(postData),
    sender = url.parse(sender || ''),
    options = {
      hostname: sender.hostname || this.receiver.host,
      port: sender.port || this.receiver.port,
      path: sender.path || this.receiver.path,
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
  var that = this;

  this.fired.forEach(function (trigger) {
    that.sendRequest(that.users, trigger.url);
  });
};

SensorTrigger.prototype.sendData = function () {
  var that = this;

  this.fired.forEach(function (trigger) {
    that.sendRequest(that.data, trigger.url);
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
  app.pub.publish("trigger." + this.sensor.id, JSON.stringify(this.fired));
};

SensorTrigger.prototype.storeData = function () {
  // store data to mongodb
  var that = this,
    mongoSeries = [],
    i;

  Data.create(that.data, function (err) {
    if (err) {
      that.emit('error', err);
    } else {
      that.emit(that.config.onStored);
    }
  });
};

module.exports.SensorTrigger = SensorTrigger;
