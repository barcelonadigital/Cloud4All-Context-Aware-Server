process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , should = require('should')
  , Device = require('../models/devices').Device
  , device_sample = require('./data/device-sample') 
  , new_device_sample = require('./data/new-device-sample') 
  , device_sample_id = require('./data/device-sample-id');


describe('Device API', function () {
  var that = this;

  before(function (done){
    console.log("\n\nTESTING DEVICE API\n") 
    app.redisClient.flushall();

    Device.remove(function () {
      Device.fullSave(device_sample, function (err, item) {
        var device = new Device(item);
        device.populate('sensors', function (err, item) {
          that.device = item;
          done();
        });
      });
    });
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

