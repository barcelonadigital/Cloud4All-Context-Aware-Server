
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,it*/

var app = require('../app'),
  agg = require('../utils/aggregation'),
  should = require('should'),
  array_sample = [1, 2, 3, 4, 5, 6],
  string_sample = "1,2,3,4,5,6",
  string_noisy_sample = "([1,2,3,4,5,6])";


describe('Aggregation API', function () {
  before(function () {
    console.log("\n\nTESTING AGGREGATION UTILS\n");
  });

  it('sums an array', function (done) {
    agg.aggregate(array_sample, agg.sum, function (res) {
      res[1].should.equal(12);
      done();
    });
  });

  it('sums a string', function (done) {
    agg.aggregate(string_sample, agg.sum, function (res) {
      res[1].should.equal(12);
      done();
    });
  });

  it('sums a noisy string', function (done) {
    agg.aggregate(string_noisy_sample, agg.sum, function (res) {
      res[1].should.equal(12);
      done();
    });
  });

  it('means of a noisy string', function (done) {
    agg.aggregate(array_sample, agg.mean, function (res) {
      res[1].should.equal(4);
      done();
    });
  });
});
