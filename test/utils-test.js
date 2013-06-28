"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,it*/

var app = require('../app'),
  utils = require('../utils/utils'),
  should = require('should');


describe('Generic utils ', function () {
  before(function () {
    console.log("\n\nTESTING GENERIC UTILS\n");
  });

  it('checks uuid', function (done) {
    var uuid = "550e8400-e29b-41d4-a716-446655440000",
      res = utils.UUIDCheck(uuid),
      s = res.should.ok;
    done();
  });

  it('converts js doted objects to nested objects', function (done) {
    var doted_object = {"a.a": 1, "a.b.c": 2, "a.b.d": 3},
      res = utils.deepen(doted_object);
    res.a.b.c.should.equal(2);
    res.a.b.d.should.equal(3);
    res.a.a.should.equal(1);
    done();
  });
});
