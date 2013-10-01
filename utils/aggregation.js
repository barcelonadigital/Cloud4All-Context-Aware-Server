/**
* Aggregation Utils methods
**/

"use strict";

var  _ = require('underscore');


exports.sum = function (data, next) {
  var res = data.reduce(function (prev, cur) {
    return prev + cur.value;
  }, 0);
  next({at: null, value: res});
};

exports.mean = function (data, next) {
  exports.sum(data, function (res) {
    next({at: null, value: res.value / data.length});
  });
};

exports.max = function (data, next) {
  var max = data[0],
    index = 0;

  data.forEach(function (el) {
    if (max.value < el.value) {
      max = el;
    }
  });
  next(max);
};

exports.min = function (data, next) {
  var min = data[0],
    index = 0;

  data.forEach(function (el) {
    if (min.value > el.value) {
      min = el;
    }
  });
  next(min);
};

exports.last = function (data, next) {
  next(_.last(data));
};

exports.aggregate = function (data, operator, next) {
  /* Aggregate values in temporal dataseries: (timestamp, value)
  *  sample:
  * [
  *   { at: '2013-04-22T00:35:43.12Z', value: '1' },
  *   { at: '2013-04-22T00:55:43.73Z', value: '2' }
  * ]
  */

  operator(data, next);
};
