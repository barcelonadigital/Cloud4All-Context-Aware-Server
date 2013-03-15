process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , sensor = require('../routes/config')
  , should = require('should')
  , config_sample = require('./data/config-sample');

describe('Config API', function () {
  before(function (){
    console.log("\n\nTESTING CONFIG API\n");
    app.redisClient.flushall();
  })

  it('saves a new config base system', function (done) {
    request(app)
      .post('/configs')
      .set('Accept', 'application/json')
      .send(config_sample["base"])  
      .expect('Content-type', /json/)
      .expect(200, done);
  })

  it('gets a config system from base', function (done) {
    request(app)
      .get('/configs/base')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.include(config_sample["base"])
        done();
      });
  })

  it('updates an existing config base system', function (done) {
    request(app)
      .post('/configs/base')
      .set('Accept', 'application/json')
      .send(config_sample["base"])  
      .expect('Content-type', /json/)
      .expect(200, done);
  })

  it('saves a new sensor 1 config', function (done) {
    request(app)
      .post('/configs/')
      .set('Accept', 'application/json')
      .send(config_sample["sensor:1"])  
      .expect('Content-type', /json/)
      .expect(200, done);
  })

  it('gets a config from sensor 1', function (done) {
    request(app)
      .get('/configs/sensor:1')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.include(config_sample["sensor:1"])
        done();
      });  
  })

  it('updates an existing sensor 1 config system', function (done) {
    request(app)
      .post('/configs/base')
      .set('Accept', 'application/json')
      .send(config_sample["base"])  
      .expect('Content-type', /json/)
      .expect(200, done);
  })

  it('gets a config value from base', function (done) {
    request(app)
      .get('/configs/base/triggers.onNewData.data')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.eql({'triggers.onNewData.data': 'new'});
        done();
      });
  })

  it('sets a config value', function (done) {
    request(app)
      .post('/configs/base/triggers.onNewData.data')
      .set('Accept', 'application/json')
      .send({'triggers.onNewData.data' : 'new'})
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.eql({'triggers.onNewData.data': 'new'});
        done();
      });
  })
})
