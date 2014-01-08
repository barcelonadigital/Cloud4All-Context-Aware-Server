
"use strict";

var app = require('../app'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Trigger Schema
 */

var TriggerSchema = new Schema({
  _sensor: {type: Schema.ObjectId, ref: 'Sensor'},
  type: {type: String, enum: triggerTypes},
  threshold: Number,
  hysteresis: {type: Number, 'default': 0},
  operator: {type: String, enum: operatorTypes},
  triggered: {type: Boolean, 'default': false},
  url: String
});

var triggerTypes = {
  values: 'threshold radius'.split(' '),
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
};

var operatorTypes = {
  values: 'gt gte lte lt eq change frozen live'.split(' '),
  message: 'enum validator failed for path `{PATH}` with value `{VALUE}`'
}

TriggerSchema.statics.findByRef = function (ref, cb) {
  this.find({_sensor: ref}, cb);
};

var TriggerHistorySchema = new Schema({
  at: Date,
  value: Number,
  trigger: { 
    _sensor: {type: Schema.ObjectId, ref: 'Sensor'},
    type: {type: String, enum: triggerTypes},
    threshold: Number,
    hysteresis: {type: Number, 'default': 0},
    operator: {type: String, enum: operatorTypes},
    triggered: {type: Boolean, 'default': false},
    url: String
  }
})

var Trigger = mongoose.model('Trigger', TriggerSchema);
var TriggerHistory = mongoose.model('TriggerHistory', TriggerHistorySchema); 

module.exports = {
  Trigger: Trigger ,
  TriggerSchema: TriggerSchema,
  TriggerHistory: TriggerHistory,
};
