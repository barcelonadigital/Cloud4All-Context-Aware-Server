
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
  user_sample = require('./data/user-sample'),
  Device = require('../models/devices').Device,
  User = require('../models/users').User,
  Sensor = require('../models/devices').Sensor,
  Data = require('../models/devices').Data,
  Config = require('../models/configs').Config,
  CacheRedis = require('../managers/cache-redis').CacheRedis,
  cache = new CacheRedis(app.redisClient, app.logmessage),
  sensorClass = {'entityName': 'sensor'},
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
        Config.findByRef(that.sensor.id, callback);
      },
      function (item, callback) {
        that.config = item;
        cache.postData(sensorClass, that.sensor.id, sensor_sample_data, callback);
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

  it('emits onNewData from sensor :id', function (done) {
    e.emit("onNewData");
    e.once("storeData", function () {
      e.data.should.eql(sensor_sample_data);
    }).once("ack", done);
  });

  it('changes config and emits onNewData', function (done) {
    that.config.config.triggers.onNewData.threshold = "15";
    Config.updateByRef(that.sensor, that.config, function (err, item) {
      e.emit("onNewData");
      e.once("nonTriggered", function () {
        e.result.value.should.be.below(
          that.config.config.triggers.onNewData.threshold
        );
        done();
      });
    });
  });

  it('sends new data to sensor and emits onNewData', function (done) {
    cache.postData(sensorClass, that.sensor.id, new_sensor_sample_data, function () {
      e.emit("onNewData");
      e.once("storeData", function () {
        e.data.should.eql(new_sensor_sample_data);
      }).once("ack", done);
    });
  });

  it('sends new data to sensor and checks stored data', function (done) {
    cache.postData(sensorClass, that.sensor.id, sensor_sample_data, function () {
      e.emit("onNewData");
      e.once("ack", function () {
        Data.find({'_sensor': that.sensor}, function (err, item) {
          done();
        });
      });
    });
  });

  it('tests the diffRadius trigger system', function (done) {
    var data = [
        {at: 1, value: 1},
        {at: 2, value: 2},
        {at: 3, value: 3},
        {at: 4, value: 4.5}],
      res = {at: (new Date()).toISOString(), value: 4.5};

    e.config.diffRadius = "10";
    e.config.onTriggered = "sendData";
    e.sensor = that.sensor;
    e.result = res;

    e.emit("diffRadius");
    e.once("ack", function () {
      done();
    });
  });

  it('tests another diffRadius trigger system', function (done) {
    var data = [
        {at: 1, value: 1},
        {at: 2, value: 2},
        {at: 3, value: 3},
        {at: 4, value: 4.5}],
      res = {at: (new Date()).toISOString(), value: 4.3};

    e.config.diffRadius = "10";
    e.config.onTriggered = "sendData";
    e.sensor = that.sensor;
    e.result = res;

    e.emit("diffRadius");
    e.once("nonTriggered", function () {
      done();
    });
  });

  it('tests sendProfile system', function (done) {
    var data = [
        {at: 1, value: 1},
        {at: 2, value: 2},
        {at: 3, value: 3},
        {at: 4, value: 4.5}];

    e.config = that.config.config.triggers.onNewData;
    e.receiver = that.config.config.receiver;

    e.config.onNearby = "sendProfile";
    e.sensor = that.sensor;
    e.data = data;

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
