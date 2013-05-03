process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , should = require('should')
  , trigger = require('../triggers/sensor-trigger')
  , device_sample = require('./data/device-sample') 
  , sensor_sample_data = require('./data/sensor-sample-data')
  , Device = require('../models/devices').Device
  , Data = require('../models/devices').Data
  , Config = require('../models/configs').Config
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(app.redisClient, app.logmessage)
  , sensorClass= {'entityName': 'sensor'}
  , e = new trigger.SensorTrigger();

describe('Trigger system API', function () {
  var that = this;

  before(function (done) {

    console.log("\n\nTESTING TRIGGER SYSTEM\n") 
    app.redisClient.flushall();

    var callback = function () {
      Device.fullSave(device_sample, function (err, item) {
        that.device = new Device(item);
        that.device.populate('sensors', function (err, item) {
          that.device = item;
          that.sensor = that.device.sensors[0];
          Config.findByRef(that.sensor.id, function (err, item) {
            that.config = item;
            cache.postData(sensorClass, that.sensor.id, sensor_sample_data, function (err) {
              done();
            })
          })
        })
      })
    }

    Data.remove(function () {
      Device.remove(function () {
        callback();
      })
    })
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

    e.emit("onNewData", that.sensor.id, "onNewData");  
    e.once("store", function (data) {
      data.should.equal(sensor_sample_data.join(','));
      done();
    })
  })

  it('changes config and emits onNewData', function (done) {
    that.config.config.triggers.onNewData.threshold = "15";
    Config.updateByRef(that.sensor.id, that.config, function (err, item) {
      e.emit("onNewData", that.sensor.id, "onNewData");  
      e.once("nonTriggered", function (threshold, res, data) {
        res.should.be.below(threshold);
        done();
      })
    })
  })

  it('sends new data to sensor and emits onNewData', function (done) {
    cache.postData(sensorClass, that.sensor.id, sensor_sample_data, function () {
      e.emit("onNewData", that.sensor.id, "onNewData");  
      e.once("store", function (data) {
        data.should.equal([sensor_sample_data].join(','));
        done();
      })
    })
  })

  it('sends new data to sensor and checks stored data', function (done) {
    cache.postData(sensorClass, that.sensor.id, sensor_sample_data, function () {
      e.emit("onNewData", that.sensor.id, "onNewData");  
      e.once("ack", function () {
        Data.find({'_sensor': that.sensor.id}, function (err, item) {
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
    e.id = that.sensor.id;

    e.emit("diffRadius", data, res);  
    e.once("send", function (reply) {
      reply.should.equal(res);
      done();
    })
  })

  it('tests another diffRadius trigger system', function (done) {
    var data = [[1,1], [2,2], [3,3], [4,4.5]]
      , res = [Date.now(), 4.3]; 

    e.config.diffRadius = "10";
    e.config.triggered = "send";
    e.id = that.sensor.id;

    e.emit("diffRadius", data, res);  
    e.once("nonTriggered", function (threshold, oldres, data) {
      data.should.equal(res);
      done();
    })
  })
})
