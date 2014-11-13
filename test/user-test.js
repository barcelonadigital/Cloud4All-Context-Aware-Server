
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,beforeEach,afterEach,it*/

var app = require('../app'),
  request = require('supertest'),
  sensor = require('../controllers/user'),
  should = require('should'),
  User = require('../models/users').User,
  user_sample = require('./data/user-sample'),
  new_user_sample = require('./data/new-user-sample'),
  CacheRedis = require('../managers/cache-redis').CacheRedis,
  cache = new CacheRedis(app.redisClient, app.logmessage),
  configClass = {'entityName': 'config'};

describe('user API', function () {
  var that = this;

  before(function (done) {
    console.log("\n\nTESTING USER API\n");
    app.redisClient.flushall();

    User.remove(function () {
      that.user = new User(user_sample);
      that.user.save(function (err, item) {
        that.user.getConfig(function (err, item) {
          that.config = item;
          done();
        });
      });
    });
  });

  it('saves a new user', function (done) {
    request(app)
      .post('/users')
      .set('Accept', 'application/json')
      .send(new_user_sample)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.profile.preferences.display.screenEnhancement.magnification.should.equal(
          new_user_sample.profile.preferences.display.screenEnhancement.magnification
        );
        done();
      });
  });

  it('updates a user', function (done) {
    request(app)
      .post('/users/' + that.user.id)
      .set('Accept', 'application/json')
      .send(user_sample)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        done();
      });
  });

  it('deletes a user by his id', function (done) {
    request(app)
      .del('/users/' + that.user.id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        User.find({_id: that.user.id}, function (err, user) {
          user.should.be.empty;
          done();
        });
      });
  });
});
