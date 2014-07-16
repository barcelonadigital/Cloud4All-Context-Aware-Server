"use strict";
/*global Home*/


var mongoose = require('mongoose'),
  app = require('../app'),
  async = require('async'),
  DeviceSchema = require('./devices').DeviceSchema,
  Schema = mongoose.Schema;

/**
 * Room Schema
 */
var RoomSchema = new Schema({
  name: String,
  lenght: String,
  weight: String,
  devices: [{type: Schema.ObjectId, ref: "Device"}]
});


/**
 * Home Schema
 */
var HomeSchema = new Schema({
  name: String,
  rooms: [RoomSchema]
});


var Room = mongoose.model('Room', RoomSchema);
var Home = mongoose.model('Home', HomeSchema);

module.exports = {
	Room: Room,
  Home: Home
};