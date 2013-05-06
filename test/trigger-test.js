process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , should = require('should')
  , trigger = require('../triggers/sensor-trigger')
  , async = require('async')
  , device_sample = require('./data/device-sample') 
  , sensor_sample_data = require('./data/sensor-sample-data')
  , Device = require('../models/devices').Device
  , Sensor = require('../models/devices').Sensor
  , Data = require('../models/devices').Data
  , Config = require('../models/configs').Config
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(app.redisClient, app.logmessage)
  , sensorClass= {'entityName': 'sensor'}
  , e;

describe('Trigger system API', function () {
  var that = this;

  before(function (done) {

    console.log("\n\nTESTING TRIGGER SYSTEM\n") 
    app.redisClient.flushall();

    async.waterfall([
      function (callback) {
        Data.remove(callback);
      },
      function (item, callback) {
        Sensor.remove(callback);
      },
      function (item, callback) {
        Device.remove(callback);
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
        Config.findByRef(that.sensor.id, callback)
      },
      function (item, callback) {
        that.config = item;
        cache.postData(sensorClass, that.sensor.id, sensor_sample_data, callback);
      }], 
      done
    )
  })

  afterEach(function (done)  {
    // update config to its default
    Config.updateByRef(
      that.sensor.id, 
      {config:app.envConfig.triggers.sensor}, 
      done
    )
  })

  it('emits onNewData from sensor :id', function (done) {

    e.emit("onNewData");  
    e.once("store", function () {
      e.data.should.equal(sensor_sample_data.join(','));
      done();
    })
  })

  it('changes config and emits onNewData', function (done) {
    that.config.config.triggers.onNewData.threshold = "15";
    Config.updateByRef(that.sensor, that.config, function (err, item) {
      e.emit("onNewData");  
      e.once("nonTriggered", function () {
        e.result.should.be.below(that.config.config.triggers.onNewData.threshold);
        done();
      })
    })
  })

  it('sends new data to sensor and emits onNewData', function (done) {
    cache.postData(sensorClass, that.sensor.id, sensor_sample_data, function () {
      e.emit("onNewData");  
      e.once("store", function (data) {
        e.data.should.equal([sensor_sample_data].join(','));
        done();
      })
    })
  })

  it('sends new data to sensor and checks stored data', function (done) {
    cache.postData(sensorClass, that.sensor.id, sensor_sample_data, function () {
      e.emit("onNewData");  
      e.once("ack", function () {
        Data.find({'_sensor': that.sensor}, function (err, item) {
          done();
        })
      })
    })
  })

  it('tests the diffRadius trigger system', function (done) {
    var data = [[1,1], [2,2], [3,3], [4,4.5]]
      , res = [Date.now(), 4.5]; 

    e.config.diffRadius = "10";
    e.config.triggered = "send";
    e.sensor = that.sensor;

    e.emit("diffRadius");  
    e.once("send", function () {
      done();
    })
  })

  it('tests another diffRadius trigger system', function (done) {
    var data = [[1,1], [2,2], [3,3], [4,4.5]]
      , res = [Date.now(), 4.3]; 

    e.config.diffRadius = "10";
    e.config.triggered = "send";
    e.sensor = that.sensor;
    e.result = res;

    e.emit("diffRadius");  
    e.once("nonTriggered", function () {
      done();
    })
  })
})
