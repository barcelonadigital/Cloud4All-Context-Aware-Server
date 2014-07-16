
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,beforeEach,it*/

var app = require('../app'),
  request = require('supertest'),
  async = require('async'),
  should = require('should'),
  Home = require('../models/homes').Home,
  home = require('../controllers/home'),  
  home_sample = require('./data/new-home-sample')

describe('Home API', function () {
  var that = this;

  before(function (done) {
    console.log("\n\nTESTING HOME API\n");
    app.redisClient.flushall();
    Home.remove(function(){
    	var home = new Home(home_sample);
    	home.save(function(err){    		
    		that.home = home;
    		done();
    	})
    });    
  });

  it('gets home :id', function (done) {
  	console.log(that.home.id);
    request(app)
      .get('/homes/' + that.home.id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body._id.should.equal(that.home.id);
        done();
      });
  });
  
  it('gets all homes', function (done) {
    request(app)
      .get('/homes/')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        done();
      });
  });
  
  it('deletes a home by his id', function (done) {
    request(app)
      .del('/homes/' + that.home.id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body._id.should.be.equal(that.home.id);
        done();
      });
  });
    
});
