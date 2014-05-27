
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
  Sensor = require('../models/devices').Sensor;


describe('Sensor API', function () {
  var that = this;

  before(function (done) {
    console.log("\n\nTESTING SENSOR API\n");
    app.redisClient.flushall();

    async.waterfall([
      function (callback) {
        Sensor.remove(callback);
      },
      function (err, item, callback) {
        Device.remove(callback);
      },
      function (err, item, callback) {
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

  it('gets config from sensor :id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/config/')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body[0]._ref.should.equal(that.sensor.id);
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
      .get('/sensors/?name=Noise')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.be.an.instanceOf(Array);
        done();
      });
  });

  it('gets 404 when search not found', function (done) {
    request(app)
      .get('/sensors/?name=abracadabra')
      .expect(404, done);
  });


  it('saves a new data to sensor :id', function (done) {
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
        res.body.should.eql(
          sensor_sample_data
        );
        done();
      });
  });

  it('gets last data from sensor id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/data?q=last')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.eql(sensor_sample_data[3]);
        done();
      });
  });

  it('searches data from :start to :end', function (done) {
    var start = sensor_sample_data[0].at,
      end = sensor_sample_data[1].at;

    request(app)
      .get('/sensors/' + that.sensor.id +
        '/data?start=' + start + '&end=' + end)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.eql(sensor_sample_data.slice(0, 2));
        done();
      });
  });

  it('searches from :start to :end with incorrect format', function (done) {
    var start = "incorrect-data",
      end = sensor_sample_data[1].at;

    request(app)
      .get('/sensors/' + that.sensor.id +
        '/data?start=' + start + '&end=' + end)
      .expect('Content-type', /json/)
      .expect(500, function (err, res) {
        done();
      });
  });
});
