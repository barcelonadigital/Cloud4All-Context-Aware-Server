"use strict";
/*global Sensor,Device*/


var mongoose = require('mongoose'),
  app = require('../app'),
  async = require('async'),
  Config = require('./configs').Config,
  Schema = mongoose.Schema;

/**
 * Data Schema
 */

var DataSchema = new Schema({
  _sensor: {type: Schema.ObjectId, ref: 'Sensor'},
  at: {type: Date, "default": Date.now},
  value: Number
});

DataSchema.statics.getLast = function (sensorId, cb) {
  this
    .find({'_sensor': sensorId})
    .sort('-at')
    .limit(1)
    .exec(cb);
};

DataSchema.pre('save', function (next) {
  // save last value to sensor _last
  var id = this.id;
  Sensor.findByIdAndUpdate(this._sensor, {$set: {'_last': id}}, next);
});

var SensorSchema = new Schema({
  devid: String,
  type: String,
  _last: {type: Schema.ObjectId, ref: 'Data'}
});

/**
 * Sensor Schema
 */

SensorSchema.methods.getConfig = function (cb) {
  Config.findByRef(this.id, cb);
};

SensorSchema.methods.getDevice = function (cb) {
  Device.findOne({"sensors": this.id}, cb);
};

SensorSchema.pre('save', function (next) {
  // create default sensor-config
  var id = this.id;
  Config.findByRef(id, function (err, item) {
    if (!item) {
      var config = new Config({
        _ref: id,
        config: app.envConfig.triggers.sensor
      }).save(next);
    } else {
      next();
    }
  });
});

/**
 * Device Schema
 */

var DeviceSchema = new Schema({
  serial: {type: String, unique: true},
  gps: {type: [Number], index: '2d'},
  location: String,
  sensors: [{type: Schema.ObjectId, ref: "Sensor"}]
});

DeviceSchema.pre('remove', function (next) {
  Sensor.remove(this.sensors).exec();
  Config.remove(this.sensors.map(function (item) {
    return {_ref: item};
  })).exec();
  next();
});

DeviceSchema.statics.findNear = function (params, cb) {
  var km = 111.12;

  params.maxDistance = params.maxDistance || 1;

  this
    .model('Device')
    .find({gps: {
      $near: params.gps,
      $maxDistance: params.maxDistance / km
    }},
      cb);
};

DeviceSchema.statics.fullSave = function (data, cb) {
  var tasks = [],
    device = {},
    newDevice = JSON.parse(JSON.stringify(data)); 

  delete(newDevice.sensors); 

  data.sensors.forEach(function (el) {
    tasks.push(
      (function () {
        var sensor = new Sensor(el);
        return function (cb) {
          sensor.save(cb);
        };
      }())
    );
  });

  device = new Device(newDevice);
  device.save(function (err, item) {
    if (err) {
      cb(err, item);
    } else {
      async.parallel(tasks, function (err, results) {
        newDevice.sensors = results.map(function (el) {
          return el[0]._id;
        });
        Device.findByIdAndUpdate(device.id, newDevice, function (err, item) {
          cb(err, item);
        });
      });
    }
  });
};

DeviceSchema.statics.updateById = function (id, item, cb) {
  /*
   * Updates Device and its sensors.
   * It does not delete omitted sensors
  */

  var tasks = [];

  this.findById(id, function (err, device) {
    if (device) {
      if (item.serial !== device.serial) {
        device.serial = item.serial;
      }
      device.gps = item.gps;
      device.location = item.location;

      item.sensors.forEach(function (el) {
        tasks.push(function (cb) {
          Sensor.findById(el._id, function (err, sensor) {
            if (sensor) {
              sensor.type = el.type;
              sensor.devid = el.devid;
              sensor.save(cb);
            } else {
              new Sensor(item.sensors[sensor]).save(function (err, sensor) {
                device.sensors.push(sensor.id);
                cb();
              });
            }
          });
        });
      });
      async.parallel(tasks, function (err, res) {
        if (err) {
          cb(err);
        } else {
          device.save(cb);
        }
      });
    } else {
      cb(err, device);
    }
  });
};

var Device = mongoose.model('Device', DeviceSchema);
var Sensor = mongoose.model('Sensor', SensorSchema);
var Data = mongoose.model('Data', DataSchema);

module.exports = {
  Device: Device,
  Sensor: Sensor,
  Data: Data
};
