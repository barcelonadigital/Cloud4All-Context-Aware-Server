
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,it*/

var app = require('../app'),
  agg = require('../utils/aggregation'),
  should = require('should'),
  array_sample = [
    {"at": "2013-04-22T00:35:43.12Z", "value": 1},
    {"at": "2013-04-22T00:55:43.73Z", "value": 2},
    {"at": "2013-04-22T01:15:43.28Z", "value": 3},
    {"at": "2013-04-22T01:35:43.56Z", "value": 4}];


describe('Aggregation API', function () {
  before(function () {
    console.log("\n\nTESTING AGGREGATION UTILS\n");
  });

  it('sums an array', function (done) {
    agg.aggregate(array_sample, agg.sum, function (res) {
      res.value.should.equal(10);
      done();
    });
  });

  it('means of an array', function (done) {
    agg.aggregate(array_sample, agg.mean, function (res) {
      res.value.should.equal(2.5);
      done();
    });
  });
});
