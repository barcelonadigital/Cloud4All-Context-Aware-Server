process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , sensor = require('../routes/user')
  , should = require('should')
  , user_sample = require('./data/user-sample') 
  , config_sample = require('./data/config-sample')
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(app.redisClient, app.logmessage)
  , configClass = {'entityName': 'config'};

describe('user API', function () {
  before(function (done){
    console.log("\n\nTESTING USER API\n") 
    app.redisClient.flushall();

    cache.postItem(configClass, config_sample["base"], function () {
      cache.postItem(configClass, config_sample["user:1"], function (err){
        done();
      })
    })
  });

  app.redisClient.flushall();
  it('saves a new user', function (done) {
    request(app)
      .post('/users')
      .set('Accept', 'application/json')
      .send(user_sample)  
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.id.should.equal("1");
        res.body.profile.preferences.display.screenEnhancement.magnification.should.equal(2)
        res.body.uuid.should.equal(user_sample.uuid);
        done();
      })
  })

  it('Throws exception when saving new user with same uuid', function (done) {
    request(app)
      .post('/users')
      .set('Accept', 'application/json')
      .send(user_sample)  
      .expect('Content-type', /json/)
      .expect(500, done);
  })

  it('updates a user', function (done) {
    request(app)
      .post('/users/1')
      .set('Accept', 'application/json')
      .send(user_sample)  
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.id.should.equal("1");
        res.body.uuid.should.equal(user_sample.uuid);
        done();
      })
  })
})