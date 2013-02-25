process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , sensor = require('../routes/config')
  , should = require('should')
  , config_sample = require('./data/config-sample');

// removes all data from devel database
app.redisClient.flushall();

describe('Config API', function() {
  before(function(){
    console.log("\n\nTESTING CONFIG API\n");
  })

  it('saves a new config system', function(done) {
    request(app)
      .post('/configs')
      .set('Accept', 'application/json')
      .send(config_sample)  
      .expect('Content-type', /json/)
      .expect(200, done);
  })

  it('gets a config system', function(done) {
    request(app)
      .get('/configs/base')
      .expect('Content-type', /json/)
      .expect(200, done);
  })

  it('gets a config value', function(done) {
    request(app)
      .get('/configs/base/triggers.onNewData.data')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.key.should.equal('raw');
        done();
      });
  })
})
