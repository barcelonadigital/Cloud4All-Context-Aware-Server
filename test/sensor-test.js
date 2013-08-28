
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,beforeEach,it*/

var app = require('../app'),
  request = require('supertest'),
  sensor = require('../controllers/sensor'),
  async = require('async'),
  device = require('../controllers/device'),
  should = require('should'),
  device_sample = require('./data/device-sample'),
  sensor_sample_data = require('./data/sensor-sample-data'),
  Device = require('../models/devices').Device,
  Sensor = require('../models/devices').Sensor,
  CacheRedis = require('../managers/cache-redis').CacheRedis,
  cache = new CacheRedis(app.redisClient, app.logmessage),
  configClass = {'entityName': 'config'};


describe('Sensor API', function () {
  var that = this;

  before(function (done) {
    console.log("\n\nTESTING SENSOR API\n");
    app.redisClient.flushall();

    async.waterfall([
      function (callback) {
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
        callback(null);
      }],
      done
      );
  });

  it('gets sensor :id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body._id.should.equal(that.sensor.id);
        done();
      });
  });

  it('gets all sensors', function (done) {
    request(app)
      .get('/sensors/')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        done();
      });
  });

  it('gets noise sensors', function (done) {
    request(app)
      .get('/sensors/?type=noise')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.be.an.instanceOf(Array);
        done();
      });
  });

  it('gets 404 when search not found', function (done) {
    request(app)
      .get('/sensors/?type=abracadabra')
      .expect(404, done);
  });


  it('saves a new data to sensor :id', function (done) {
    request(app)
      .post('/sensors/' + that.sensor.id + '/data')
      .set('Accept', 'application/json')
      .send(sensor_sample_data)
      .expect(200, done);
  });

  it('saves again new data to sensor :id', function (done) {
    request(app)
      .post('/sensors/' + that.sensor.id + '/data')
      .set('Accept', 'application/json')
      .send(sensor_sample_data)
      .expect(200, done);
  });

  it('gets all data from sensor id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/data')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(
          [sensor_sample_data, sensor_sample_data].join(',')
        );
        done();
      });
  });

  it('gets all data from sensor id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/data?q=all')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(
          [sensor_sample_data, sensor_sample_data].join(',')
        );
        done();
      });
  });

  it('gets new data from sensor id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/data?q=new')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(sensor_sample_data.join(','));
        done();
      });
  });
});
