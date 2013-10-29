
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,beforeEach,afterEach,it*/

var app = require('../app'),
  request = require('supertest'),
  should = require('should'),
  trigger = require('../triggers/user-trigger'),
  async = require('async'),
  device_sample = require('./data/device-sample'),
  user_sample = require('./data/new-user-sample'),
  new_data = require('./data/new-sensor-sample-data'),
  Device = require('../models/devices').Device,
  Sensor = require('../models/devices').Sensor,
  User = require('../models/users').User,
  Data = require('../models/devices').Data,
  Config = require('../models/configs').Config,
  CacheRedis = require('../managers/cache-redis').CacheRedis,
  cache = new CacheRedis(app.redisClient, app.logmessage),
  sensorClass = {'entityName': 'sensor'};

describe('Sensor trigger system', function () {
  var that = this;

  before(function (done) {

    console.log("\n\nTESTING USER TRIGGER SYSTEM\n");
    app.redisClient.flushall();

    async.waterfall([
      function (callback) {
        User.remove(callback);
      },
      function (item, callback) {
        Data.remove(callback);
      },
      function (item, callback) {
        Sensor.remove(callback);
      },
      function (item, callback) {
        Device.remove(callback);
      },
      function (item, callback) {
        that.user = new User(user_sample);
        that.user.save(function (err, item) {
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
        Config.findByRef(that.sensor.id, callback);
      },

      function (item, callback) {
        that.config = item;
        that.data = [];

        var now = Date.now(),
          num = 4,
          sleep = 1000,
          i = 0;

        for (i = 0; i < num; i++) {
          that.data[i] = {
            at: new Date(now - sleep * i / (2 * num)).toISOString(),
            value: Math.floor((Math.random() * 10) + 1)
          };
        }
        cache.postData(sensorClass, that.sensor.id, that.data, callback);
      }],
      done
      );
  });

  it('emits on new user :id gets config', function (done) {
    var e = new trigger.UserTrigger(that.user);
    e.emit('onNewUser');
    e.once('getNearSensors', function () {
      e.config.should.eql(app.envConfig.triggers.user.triggers.onNewUser);
      done();
    });
  });

  it('emits on new user :id gets nearby sensors', function (done) {
    var e = new trigger.UserTrigger(that.user);
    e.emit('onNewUser');
    e.once('getLastData', function () {
      e.sensors.length.should.eql(that.device.sensors.length);
      done();
    });
  });

  it('emits on new user :id gets last data', function (done) {
    var e = new trigger.UserTrigger(that.user);
    e.emit('onNewUser');
    e.once('sendProfile', function () {
      e.data[0].data.should.eql(that.data.reverse());
      done();
    });
  });
});
