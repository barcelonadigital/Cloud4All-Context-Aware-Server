
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,beforeEach,it*/

var app = require('../app'),
  request = require('supertest'),
  async = require('async'),
  should = require('should'),
  Device = require('../models/devices').Device,
  Sensor = require('../models/devices').Sensor,
  Config = require('../models/configs').Config,
  device_sample = require('./data/device-sample'),
  new_device_sample = require('./data/new-device-sample'),
  device_sample_id = require('./data/device-sample-id');


describe('Device Model', function () {
  var that = this;

  that.cleanDatabase = function (done) {
    async.waterfall([
      function (cb) {
        Sensor.remove(cb);
      },
      function (item, cb) {
        Device.remove(cb);
      }],
      done
      );
  };

  before(function (done) {
    app.redisClient.flushall();
    console.log("\n\nTESTING DEVICE MODEL\n");
    done();
  });

  beforeEach(function (done) {
    that.cleanDatabase(done);
  });

  it('saves a device', function (done) {
    Device.fullSave(device_sample, function (err, item) {
      item.serial.should.equal(device_sample.serial);
      item.populate('sensors', function (err, item) {
        item.sensors[0].should.have.property("devid");
        item.sensors[0].should.have.property("type");
        done();
      });
    });
  });

  it('removes a device and its sensors', function (done) {
    Device.fullSave(device_sample, function (err, device) {
      Sensor.find({}, function (err, sensors) {
        sensors.should.not.be.empty;
        device.remove(function (err) {
          Sensor.find({maxDistance: 10}, function (err, sensors) {
            sensors.should.be.empty;
            done();
          });
        });
      });
    });
  });

  it('checks nearby function', function (done) {
    Device.fullSave(device_sample, function (err, device) {
      var gps = [2.197212, 41.402423];
      Device.findNear({gps: gps}, function (err, item) {
        item.should.not.be.empty;
        done();
      });
    });
  });

  it('checks max distance nearby function', function (done) {
    Device.fullSave(device_sample, function (err, device) {
      var gps = [2.197212, 41.402423];
      Device.findNear({gps: gps, maxDistance: 0.01}, function (err, item) {
        item.should.be.empty;
        done();
      });
    });
  });

  it('gets a device from sensor', function (done) {
    Device.fullSave(device_sample, function (err, device) {
      Sensor.findById(device.sensors[0], function (err, sensor) {
        sensor.getDevice(function (err, item) {
          item.id.should.equal(device.id);
          done();
        });
      });
    });
  });
});

describe('Device API', function () {
  var that = this;

  before(function (done) {
    console.log("\n\nTESTING DEVICE API\n");
    app.redisClient.flushall();
    async.waterfall([
      function (cb) {
        Sensor.remove(cb);
      },
      function (item, cb) {
        Device.remove(cb);
      },
      function (item, cb) {
        Device.fullSave(device_sample, cb);
      },
      function (item, cb) {
        var device = new Device(item);
        device.populate('sensors', cb);
      },
      function (item, cb) {
        that.device = item;
        cb(null);
      }],
      done
      );
  });

  it('saves a new device', function (done) {
    request(app)
      .post('/devices')
      .set('Accept', 'application/json')
      .send(new_device_sample)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.serial.should.equal("serial-3");
        done();
      });
  });

  it('raises exception when saves a new device with same serial', function (done) {
    request(app)
      .post('/devices')
      .set('Accept', 'application/json')
      .send(device_sample)
      .expect('Content-type', /json/)
      .expect(500, done);
  });

  it('updates a device', function (done) {
    that.device.serial = "new-serial";
    that.device.sensors[0].devid = 11;
    request(app)
      .post('/devices/' + that.device._id)
      .set('Accept', 'application/json')
      .send(that.device)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.serial.should.equal(that.device.serial);
        Sensor.findById(that.device.sensors[0], function (err, sensor) {
          sensor.devid.should.equal(that.device.sensors[0].devid);
          done();
        });
      });
  });

  it('gets a device', function (done) {
    request(app)
      .get('/devices/' + that.device._id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body._id.should.equal(that.device._id.toString());
        res.body.serial.should.equal(that.device.serial);
        done();
      });
  });

  it('gets a non existent objectid device. Handles 404 error', function (done) {
    request(app)
      .get('/devices/517686388661d24a16000999')
      .expect('Content-type', 'text/plain')
      .expect(404, done);
  });

  it('gets a wrong device id. Handles 500 error', function (done) {
    request(app)
      .get('/devices/wrong-id')
      .expect('Content-type', 'text/plain')
      .expect(500, done);
  });

  it('deletes a device by his id', function (done) {
    request(app)
      .del('/devices/' + that.device.id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.serial.should.be.equal(that.device.serial);
        async.parallel([
          function (cb) {
            Device.find({_id: that.device.id}, cb);
          },
          function (cb) {
            Sensor.find({_id: that.device.sensors[0]}, cb);
          },
          function (cb) {
            Config.find({_ref: that.device.sensors[0]}, cb);
          }],
          function (err, results) {
            results.forEach(function (item) {
              item.should.be.empty;
            });
            done();
          });
      });
  });
});
