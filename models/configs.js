
"use strict";

var app = require('../app'),
  mongoose = require('mongoose'),
  utils = require('../utils/utils'),
  Schema = mongoose.Schema;

/**
 * Config Schema
 */

var ConfigSchema = new Schema({
  _ref: {type: Schema.ObjectId, unique: true},
  config: {type: Schema.Types.Mixed, 'default': app.envConfig.triggers.sensor},
});

ConfigSchema.statics.findByRef = function (ref, cb) {
  this.findOne({_ref: ref}, cb);
};

ConfigSchema.statics.updateByRef = function (ref, item, cb) {
  this.findByRef(ref, function (err, config) {
    if (config) {
      config.config = item.config;
      config.save(cb);
    } else {
      cb(err, config);
    }
  });
};

var Config = mongoose.model('Config', ConfigSchema);

module.exports = {
  Config: Config
};
