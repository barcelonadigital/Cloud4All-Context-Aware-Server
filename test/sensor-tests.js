var app = require('../app')
  , request = require('supertest')
  , sensor = require('../routes/sensor')
  , should = require('should')
  , redis = require('redis')
  , db = redis.createClient()
  , sensor_sample = {
    'gps': [1, 2, 3, 4],  // [xi, yi, zi, ti]
    'type': 'light',
    'id': 1, 
    'uuid': '550e8400-e29b-41d4-a716-446655440000'}
  , sensor_sample_data = [1, 2, 3, 4];

db.flushall();

describe('POST /sensors', function() {
  it('saves a new sensor', function(done) {
    request(app)
      .post('/sensors')
      .set('Accept', 'application/json')
      .send(sensor_sample)  
      .expect('Content-type', /json/)
      .expect(200, function(err, res) {
        res.body.sensor.should.equal('sensor:' + sensor_sample.id);
        done();
      });
  });
});

describe('GET /sensors/:id', function() {
  it('gets a sensor', function(done) {
    request(app)
      .get('/sensors/' + sensor_sample.id)
      .expect('Content-type', /json/)
      .expect(200, function(err, res) {
        if (err) {
          console.log(err);
        } else {
          res.body.uuid.should.equal(sensor_sample.uuid);
          res.body.type.should.equal(sensor_sample.type);
        }
        done();
      });
  });
  it('gets a sensor using uuid', function(done) {
    request(app)
      .get('/sensors/' + sensor_sample.uuid)
      .expect('Content-type', /json/)
      .expect(200, function(err, res) {
        if (err) {
          console.log(err);
        } else {
          res.body.uuid.should.equal(sensor_sample.uuid);
          res.body.type.should.equal(sensor_sample.type);
        }
        done();
      });
  });
  it('gets a wrong sensor. Handles 404 error', function(done) {
    request(app)
      .get('/sensors/wrong-sensor')
      .expect('Content-type', 'text/plain')
      .expect(404, done);
  });
});

describe('POST /sensors/:id/data', function() {
  it('saves a new data to sensor :id', function(done) {
    request(app)
      .post('/sensors/' + sensor_sample.id + '/data')
      .set('Accept', 'application/json')
      .send(sensor_sample_data) 
      .expect(200, done);
  });

  it('saves again new data to sensor :id', function(done) {
    request(app)
      .post('/sensors/' + sensor_sample.id + '/data')
      .set('Accept', 'application/json')
      .send(sensor_sample_data) 
      .expect(200, done);
  });
});

describe('GET /sensors/:id/data', function() {
  it('gets all data from sensor id', function(done) {
    request(app)
      .get('/sensors/' + sensor_sample.id + '/data')
      .expect('Content-type', /json/)
      .expect(200, done);
  });
});


