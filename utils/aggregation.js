/**
* Aggregation Utils methods 
**/

var  _ = require('underscore');


exports.sum = function (value, next) {
  var res = value.reduce(function (prev, cur){return prev + cur;});
  next(res);
} 

exports.mean = function (value, next) {
  exports.sum(value, function (res){
    next(res / value.length);
  })
}

exports.max = function (value, next) {
  next(_.max(value));
}

exports.min = function (value, next) {
  next(_.min(value));
}

exports.last = function (value, next) {
  next(_.last(value));
}

exports.aggregate = function (value, operator, next) {

  // values are in temporal dataseries: (timestamp, value)
  var isOdd = function(val, key) {return key % 2 != 0}

  if (value instanceof Array) {
    operator(value.filter(isOdd).map(parseFloat), next);
  } else if (typeof value == "string") {
    operator(value.replace(/[^0-9.,]+/g,"").split(",")
                  .filter(isOdd).map(parseFloat), next);
  }
}
