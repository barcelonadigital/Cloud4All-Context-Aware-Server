
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,beforeEach,afterEach,it*/

var app = require('../app'),
  request = require('supertest'),
  should = require('should'),
  trigger = require('../triggers/sensor-trigger'),
  async = require('async'),
  device_sample = require('./data/device-sample'),
  sensor_sample_data = require('./data/sensor-sample-data'),
  new_sensor_sample_data = require('./data/new-sensor-sample-data'),
  trigger_sample = require('./data/trigger-sample'),
  user_sample = require('./data/user-sample'),
  Device = require('../models/devices').Device,
  Trigger = require('../models/triggers').Trigger,
  User = require('../models/users').User,
  Sensor = require('../models/devices').Sensor,
  Data = require('../models/devices').Data,
  Config = require('../models/configs').Config,
  e;

describe('Sensor trigger system', function () {
  var that = this;

  before(function (done) {

    console.log("\n\nTESTING SENSOR TRIGGER SYSTEM\n");
    app.redisClient.flushall();

    async.waterfall([
      function (callback) {
        Data.remove(callback);
      },
      function (item, callback) {
        User.remove(callback);
      },
      function (item, callback) {
        Sensor.remove(callback);
      },
      function (item, callback) {
        Trigger.remove(callback);
      },
      function (item, callback) {
        Device.remove(callback);
      },
      function (item, callback) {
        var user = new User(user_sample);
        user.save(function (err, item) {
          callback(null, item);
        });
      },
      function (item, callback) {
        Device.fullSave(device_sample, callback);
      },
      function (item, callback) {
        var device = new Device(item);
        device.populate('sensors', callback);
      },
      function (item, callback) {
        that.device = item;
        that.sensor = that.device.sensors[0];
        e = new trigger.SensorTrigger(that.sensor);
        callback(null);
      },
      function (callback) {
        that.trigger = new Trigger(trigger_sample);
        that.trigger._sensor.id = that.sensor.id;
        that.trigger.save(function (err, item) {
          callback(null);
        });
      },
      function (callback) {
        Config.findByRef(that.sensor.id, callback);
      },
      function (item, callback) {
        that.config = item;
        that.data = sensor_sample_data.map(function (el) {
          return {
            '_sensor': that.sensor.id, 
            'at': el.at, 
            'value': el.value};
        });
        Data.create(that.data, callback);
      }],
      done
      );
  });

  afterEach(function (done) {
    // update config to its default
    e.config = that.config.config.triggers.onNewData;
    Config.updateByRef(
      that.sensor.id,
      {config: app.envConfig.triggers.sensor},
      done
    );
  });

  it('emits onNewData from sensor :id, checks triggered', function (done) {
    e.emit("onNewData", that.data);
    e.once("getNearUsers", function () {
      e.data.should.eql(that.data);
      done();
    });
  });

  it('changes trigger and emits onNewData, checks nonTriggered', function (done) {
    that.trigger.update({"threshold": 5}, function () {
      e.emit("onNewData", that.data);
      e.once("ack", function () {
        e.fired.length.should.eql(0);
        that.trigger.update({"threshold": 3}, done);
      });
    })
  });

  it('sends new data to sensor and checks stored data', function (done) {
    e.emit("onNewData", that.data);
    e.once("ack", function () {
      Data.find({'_sensor': that.sensor}, function (err, item) {
        done();
      });
    });
  });

  it('tests sendProfile system', function (done) {
    e.config.onNearby = "sendProfile";
    e.sensor = that.sensor;
    e.data = that.data;

    e.emit("getNearUsers");
    e.once("storeData", function (chunk) {
      JSON
        .parse(chunk)[0]
        .profile.preferences
        .display.screenEnhancement
        .tracking.should.equal("mouse");
    }).once("ack", done);
  });
});
