process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , should = require('should')
  , trigger = require('../utils/triggers')
  , sensor_sample = require('./data/sensor-sample-uuid') 
  , sensor_sample_data = require('./data/sensor-sample-data')
  , config_sample = require('./data/config-sample')
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(app.redisClient, app.logmessage)
  , sensorClass= {'entityName': 'sensor'}
  , configClass = {'entityName': 'config'}
  , e = new trigger.SensorTrigger();

describe('Trigger system API', function () {
  before(function (done) {

    console.log("\n\nTESTING TRIGGER SYSTEM\n") 

    app.redisClient.flushall();
    cache.postItem(sensorClass, sensor_sample, function (err, item) {
      cache.postItem(configClass, config_sample["base"], function () {
        cache.postData(sensorClass, item.id, sensor_sample_data, function (err){
          done();
        })
      })
    })
  })

  it('emits onNewData from sensor 1', function (done) {
    var id = 1;

    e.emit("onNewData", id, "onNewData");  
    e.once("receiverOk", function (chunk, res) {
      var data = JSON.parse(chunk);
      data["data"].should.equal(sensor_sample_data.join(','));
      data["id"].should.equal(id.toString());
      done();
    })
  })

  it('changes config and emits onNewData', function (done) {
    var configId = "base"
      , id = 1
      , key = "triggers.onNewData.threshold" 
      , value = "10";

    cache.updateHashItem(configClass, configId, key, value, function (err, item) {
      e.emit("onNewData", id, "onNewData");  
      e.once("nonTriggered", function (threshold, res, data) {
        res.should.be.below(threshold);
        done();
      })
    })
  })

  it('adds sensor config and emits onNewData', function (done) {
    var id = 1;

    cache.postItem(configClass, config_sample["sensor:1"], function () {
      e.emit("onNewData", id, "onNewData");  
      e.once("nonTriggered", function (threshold, res, data) {
        res.should.be.below(threshold);
        done();
      })
    })
  })

  it('sends new data to sensor and emits onNewData', function (done) {
    var id = 1;

    cache.postData(sensorClass, id, sensor_sample_data, function () {
      e.emit("onNewData", id, "onNewData");  
      e.once("receiverOk", function (chunk, res) {
        var data = JSON.parse(chunk);
        data["data"].should.equal([sensor_sample_data, sensor_sample_data].join(','));
        data["id"].should.equal(id.toString());
        done();
      })
    })
  })
})
