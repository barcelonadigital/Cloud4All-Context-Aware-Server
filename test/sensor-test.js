process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , sensor = require('../routes/sensor')
  , should = require('should')
  , sensor_sample = require('./data/sensor-sample-uuid') 
  , sensor_sample_no_uuid = require('./data/sensor-sample-no-uuid')
  , sensor_sample_data = require('./data/sensor-sample-data')
  , config_sample = require('./data/config-sample')
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(app.redisClient, app.logmessage)
  , configClass = {'entityName': 'config'};

describe('Sensor API', function () {
  before(function (){
    console.log("\n\nTESTING SENSOR API\n") 
  });

  app.redisClient.flushall();
  it('saves a new sensor', function (done) {
    request(app)
      .post('/sensors')
      .set('Accept', 'application/json')
      .send(sensor_sample)  
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.id.should.equal("1");
        res.body.uuid.should.equal(sensor_sample.uuid);
        done();
      })
  })

  it('Throws exception when saving new sensor with same uuid', function (done) {
    request(app)
      .post('/sensors')
      .set('Accept', 'application/json')
      .send(sensor_sample)  
      .expect('Content-type', /json/)
      .expect(500, done);
  })

  it('It admits new sensor without uuid', function (done) {
    request(app)
      .post('/sensors')
      .set('Accept', 'application/json')
      .send(sensor_sample_no_uuid)  
      .expect('Content-type', /json/)
      .expect(200, done);
  })

  it('updates a sensor', function (done) {
    request(app)
      .post('/sensors/1')
      .set('Accept', 'application/json')
      .send(sensor_sample)  
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.id.should.equal("1");
        res.body.uuid.should.equal(sensor_sample.uuid);
        done();
      })
  })

  it('gets a sensor', function (done) {
    request(app)
      .get('/sensors/1')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        if (err) {
          console.log(err);
        } else {
          res.body.uuid.should.equal(sensor_sample.uuid);
          res.body.type.should.equal(sensor_sample.type);
        }
        done();
      })
  })

  it('search a sensor using uuid', function (done) {
    request(app)
      .get('/sensors?uuid=' + sensor_sample.uuid)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        if (err) {
          console.log(err);
        } else {
          res.body.uuid.should.equal(sensor_sample.uuid);
          res.body.type.should.equal(sensor_sample.type);
        }
        done();
      })
  })

  it('gets a wrong sensor. Handles 404 error', function (done) {
    request(app)
      .get('/sensors/wrong-sensor')
      .expect('Content-type', 'text/plain')
      .expect(404, done);
  })

  it('saves a new data to sensor :id', function (done) {
    request(app)
      .post('/sensors/1/data')
      .set('Accept', 'application/json')
      .send(sensor_sample_data) 
      .expect(200, done);
  })

  it('saves again new data to sensor :id', function (done) {
    request(app)
      .post('/sensors/1/data')
      .set('Accept', 'application/json')
      .send(sensor_sample_data) 
      .expect(200, done);
  })
  
  it('gets all data from sensor id', function (done) {
    request(app)
      .get('/sensors/1/data')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(
          [sensor_sample_data, sensor_sample_data].join(','));
        done();
      })
  })

  it('gets all data from sensor id', function (done) {
    request(app)
      .get('/sensors/1/data?q=all')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(
          [sensor_sample_data, sensor_sample_data].join(','));
        done();
      })
  })

  it('gets new data from sensor id', function (done) {
    request(app)
      .get('/sensors/1/data?q=new')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.data.should.equal(sensor_sample_data.join(','));
        done();
      })
  })
})

