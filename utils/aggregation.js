/**
* Aggregation Utils methods
**/

"use strict";

var  _ = require('underscore');


exports.sum = function (value, timestamp, next) {
  var res = value.reduce(function (prev, cur) {
    return prev + cur;
  });
  next([null, res]);
};

exports.mean = function (value, timestamp, next) {
  exports.sum(value, timestamp, function (res) {
    next([null, res[1] / value.length]);
  });
};

exports.max = function (value, timestamp, next) {
  var max = value[0],
    index = 0;

  value.forEach(function (el, ind) {
    if (max < el) {
      max = el;
      index = ind;
    }
  });
  next([timestamp[index], max]);
};

exports.min = function (value, timestamp, next) {
  var min = value[0],
    index = 0;

  value.forEach(function (el, ind) {
    if (min > el) {
      min = el;
      index = ind;
    }
  });
  next([timestamp[index], min]);
};

exports.last = function (value, timestamp, next) {
  next([_.last(timestamp), _.last(value)]);
};

exports.aggregate = function (value, operator, next) {
  // values are in temporal dataseries: (timestamp, value)
  var isOdd = function (val, key) {return key % 2 !== 0; },
    isEven = function (val, key) {return key % 2 === 0; },
    array;

  if (value instanceof Array) {
    array = value;
  } else if (typeof value === "string") {
    array = value.replace(/[^0-9.,]+/g, "").split(",");
  }
  operator(
    array.filter(isOdd).map(parseFloat),
    array.filter(isEven).map(parseFloat),
    next
  );
};
