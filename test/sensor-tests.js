var app = require('../app')
  , request = require('supertest')
  , sensor = require('../routes/sensor')
  , should = require('should')
  , sensor_sample = require('./data/sensor-sample') 
  , sensor_sample_data = require('./data/sensor-sample-data');


// removes all data from devel database
app.redisClient.flushall();

describe('POST /sensors', function() {
  it('saves a new sensor', function(done) {
    request(app)
      .post('/sensors')
      .set('Accept', 'application/json')
      .send(sensor_sample)  
      .expect('Content-type', 'text/plain')
      .expect(200, done);
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
  it('search a sensor using uuid', function(done) {
    request(app)
      .get('/sensors?uuid=' + sensor_sample.uuid)
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
      .expect(200, function (err, res) {
        res.body.data.should.equal(
          [sensor_sample_data, sensor_sample_data].join(','));
        done();
      });
  });
});


