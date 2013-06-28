var env = require('./env'),
  _ = require('underscore');

exports.config = function () {

  "use strict";

  var node_env = process.env.NODE_ENV || 'development';
  var node_default = process.env.NODE_DEFAULT || 'default';
  return _.extend(env[node_env], env[node_default]);
};