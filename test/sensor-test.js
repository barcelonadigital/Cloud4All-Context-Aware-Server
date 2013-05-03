process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , sensor = require('../controllers/sensor')
  , device = require('../controllers/device')
  , should = require('should')
  , device_sample = require('./data/device-sample') 
  , sensor_sample_data = require('./data/sensor-sample-data')
  , Device = require('../models/devices').Device
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(app.redisClient, app.logmessage)
  , configClass = {'entityName': 'config'};


describe('Sensor API', function () {
  var that = this;

  before(function (done){
    console.log("\n\nTESTING SENSOR API\n") 
    app.redisClient.flushall();

    Device.remove(function () {
      Device.fullSave(device_sample, function (err, item) {
        that.device = new Device(item);
        that.device.populate('sensors', function (err, item) {
          that.device = item;
          that.sensor = that.device.sensors[0];
          done();
        })
      })
    })
  })

  it('saves a new data to sensor :id', function (done) {
    request(app)
      .post('/sensors/' + that.sensor.id + '/data')
      .set('Accept', 'application/json')
      .send(sensor_sample_data) 
      .expect(200, done);
  })

  it('saves again new data to sensor :id', function (done) {
    request(app)
      .post('/sensors/' + that.sensor.id + '/data')
      .set('Accept', 'application/json')
      .send(sensor_sample_data) 
      .expect(200, done);
  })
  
  it('gets all data from sensor id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/data')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(
          [sensor_sample_data, sensor_sample_data].join(','));
        done();
      })
  })

  it('gets all data from sensor id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/data?q=all')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(
          [sensor_sample_data, sensor_sample_data].join(','));
        done();
      })
  })

  it('gets new data from sensor id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/data?q=new')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(sensor_sample_data.join(','));
        done();
      })
  })
})