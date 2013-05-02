process.env.NODE_ENV = 'test';

var app = require('../app')
  , request = require('supertest')
  , sensor = require('../controllers/user')
  , should = require('should')
  , User = require('../models/users').User
  , user_sample = require('./data/user-sample') 
  , new_user_sample = require('./data/new-user-sample') 
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(app.redisClient, app.logmessage)
  , configClass = {'entityName': 'config'};

describe('user API', function () {
  var that = this;

  before(function (done){
    console.log("\n\nTESTING USER API\n") 
    app.redisClient.flushall(done);

    User.remove(function () {
      that.user = new User(user_sample);
      that.user.save(function (err, item) {
        that.user.getConfig(function (err, item) {
          that.config = item;
          done();
        })
      })
    })
  })

  it('saves a new user', function (done) {
    request(app)
      .post('/users')
      .set('Accept', 'application/json')
      .send(new_user_sample)  
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.uuid.should.equal(new_user_sample.uuid);
        res.body.profile.preferences.display.screenEnhancement.magnification.should.equal(
          new_user_sample.profile.preferences.display.screenEnhancement.magnification);
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
      .post('/users/' + that.user.id)
      .set('Accept', 'application/json')
      .send(user_sample)  
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.uuid.should.equal(that.user.uuid);
        done();
      })
  })

  it('finds a user by his uuid', function (done) {
    request(app)
      .get('/users/' + '?uuid=' + that.user.uuid)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.uuid.should.equal(that.user.uuid);
        done();
      })
  })
})