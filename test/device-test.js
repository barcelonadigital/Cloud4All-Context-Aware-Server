process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , async = require('async')
  , should = require('should')
  , Device = require('../models/devices').Device
  , Sensor = require('../models/devices').Sensor
  , device_sample = require('./data/device-sample') 
  , new_device_sample = require('./data/new-device-sample') 
  , device_sample_id = require('./data/device-sample-id');


describe('Device Model', function () {
  var that = this;

  that.cleanDatabase = function (done) {
    async.waterfall([
      function (callback) {
        Sensor.remove(callback);
      },
      function (item, callback) {
        Device.remove(callback);
      }],
      done
    )
  }

  before(function (done) {
    app.redisClient.flushall();
    console.log("\n\nTESTING DEVICE MODEL\n");
    done();
  })

  beforeEach(function (done) {
    that.cleanDatabase(done);
  })

  it('saves a device', function (done) {
    Device.fullSave(device_sample, function (err, item) {
      item.serial.should.equal(device_sample.serial);
      item.populate('sensors', function (err, item) {
        item.sensors[0].should.have.property("devid");
        item.sensors[0].should.have.property("type");
        done();
      })
    })
  })

  it('removes a device and its sensors', function (done) {
    Device.fullSave(device_sample, function (err, device) {
      Sensor.find({}, function (err, sensors) {
        sensors.should.not.be.empty;
        device.remove(function (err) {
          Sensor.find({maxDistance:10}, function (err, sensors) {
            sensors.should.be.empty;
            done();
          })
        })
      })
    })
  })

  it('checks nearby function', function (done) {
    Device.fullSave(device_sample, function (err, device) {
      var gps = [2.197212, 41.402423];
      Device.findNear({gps:gps}, function (err, item) {
        item.should.not.be.empty;
        done();
      })
    })
  })

  it('checks max distance nearby function', function (done) {
    Device.fullSave(device_sample, function (err, device) {
      var gps = [2.197212, 41.402423];
      Device.findNear({gps:gps, maxDistance:0.01}, function (err, item) {
        item.should.be.empty;
        done();
      })
    })
  })
})

describe('Device API', function () {
  var that = this;

  before(function (done) {
    console.log("\n\nTESTING DEVICE API\n") 
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
        callback(null);
      }], 
      done
    )
  })

  it('saves a new device', function (done) {
    request(app)
      .post('/devices')
      .set('Accept', 'application/json')
      .send(new_device_sample)  
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.serial.should.equal("serial-3");
        done();
      })
  })

  it('raises exception when saves a new device with same serial', function (done) {
    request(app)
      .post('/devices')
      .set('Accept', 'application/json')
      .send(device_sample)  
      .expect('Content-type', /json/)
      .expect(500, done);
  })

  it('updates a device', function (done) {
    that.device.serial = "new-serial";
    request(app)
      .post('/devices/' + that.device._id)
      .set('Accept', 'application/json')
      .send(that.device)  
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.serial.should.equal(that.device.serial);
        done();
      })
  })

  it('gets a device', function (done) {
    request(app)
      .get('/devices/' + that.device._id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body._id.should.equal(that.device._id.toString());
        res.body.serial.should.equal(that.device.serial);
        done();
      })
  })

  it('gets a non existent objectid device. Handles 404 error', function (done) {
    request(app)
      .get('/devices/517686388661d24a16000999')
      .expect('Content-type', 'text/plain')
      .expect(404, done);
  })

  it('gets a wrong device id. Handles 500 error', function (done) {
    request(app)
      .get('/devices/wrong-id')
      .expect('Content-type', 'text/plain')
      .expect(500, done);
  })
})

