
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,it*/

var app = require('../app'),
  request = require('supertest'),
  sensor = require('../controllers/config'),
  Config = require('../models/configs').Config,
  should = require('should'),
  sensor_config_sample = require('./data/sensor-config-sample'),
  new_sensor_config_sample = require('./data/new-sensor-config-sample');

describe('Config API', function () {
  var that = this;

  before(function (done) {
    console.log("\n\nTESTING CONFIG API\n");
    app.redisClient.flushall();
    Config.remove(function () {
      that.config = new Config(sensor_config_sample);
      that.config.save(done);
    });
  });

  it('saves a new sensor config', function (done) {
    request(app)
      .post('/configs/')
      .set('Accept', 'application/json')
      .send(new_sensor_config_sample)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.config.triggers.onNewData.should.eql(
          new_sensor_config_sample.config.triggers.onNewData
        );
        done();
      });
  });

  it('gets a config from sensor :id', function (done) {
    request(app)
      .get('/configs/' + sensor_config_sample._ref)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.config.triggers.should.eql(
          sensor_config_sample.config.triggers
        );
        done();
      });
  });

  it('updates an existing sensor :id config system', function (done) {
    request(app)
      .post('/configs/' + sensor_config_sample._ref)
      .set('Accept', 'application/json')
      .send(sensor_config_sample)
      .expect('Content-type', /json/)
      .expect(200, done);
  });
});
