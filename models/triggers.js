
"use strict";

var app = require('../app'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Trigger Schema
 */

var triggerTypes = {
  values: ['threshold', 'radius'],
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
};

var operatorTypes = {
  values: ['gt', 'gte', 'lte', 'lt', 'eq', 'neq', 'change', 'frozen', 'live'],
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
};

var TriggerSchema = new Schema({
  _sensor: {type: Schema.ObjectId, ref: 'Sensor'},
  type: {type: String, enum: triggerTypes},
  threshold: Number,
  hysteresis: {type: Number, 'default': 0},
  operator: {type: String, enum: operatorTypes},
  triggered: {type: Boolean, 'default': false},
  url: String
});

TriggerSchema.statics.findByRef = function (ref, cb) {
  this.find({_sensor: ref}, cb);
};

var TriggerHistorySchema = new Schema({
  _sensor: {type: Schema.ObjectId, ref: 'Sensor'},
  at: Date,
  value: Number,
  trigger: {type: Schema.Types.Mixed}
});

TriggerHistorySchema.statics.findByRef = function (ref, cb) {
  this.find({_sensor: ref}, cb);
};

TriggerHistorySchema.statics.getTime = function (start, end, cb) {
  this
    .find({
      at: {'$gte': start, '$lte': end}
    })
    .sort('at')
    .exec(cb);
};

var Trigger = mongoose.model('Trigger', TriggerSchema);
var TriggerHistory = mongoose.model('TriggerHistory', TriggerHistorySchema);

module.exports = {
  Trigger: Trigger,
  TriggerSchema: TriggerSchema,
  TriggerHistory: TriggerHistory,
};
