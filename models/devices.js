var mongoose = require('mongoose')
  , app = require('../app')
  , async = require('async')
  , Config = require('./configs').Config
  , Schema = mongoose.Schema;

/**
 * Sensor Schema
 */

var DataSchema = new Schema({
  _sensor: {type: Schema.ObjectId, ref: 'Sensor'},
  timestamp: {type: Date, default: Date.now},
  data: Number
})

DataSchema.statics.getLast = function (sensorId, cb) {
  this
    .find({'_sensor': sensorId})
    .sort('-timestamp')
    .limit(1)
    .exec(cb);
}

var SensorSchema = new Schema({
  devid: String,
  type: String,
})

SensorSchema.methods.getConfig = function (cb) {
  Config.findByRef(this.id, cb);
}

SensorSchema.pre('save', function (next) {
  // create default sensor-config
  var id = this.id;
  Config.findByRef(id, function (err, item) {
    if (!item) {
      var config = new Config({_ref: id});
      config.save();
    }
  })
  next();
})

var DeviceSchema = new Schema({
  serial: {type: String, unique: true},
  gps: [Number],
  location: String,
  sensors:[{type: Schema.ObjectId, ref: "Sensor"}]
})

DeviceSchema.statics.fullSave = function (data, cb) {
  var tasks = [];
  for (var i = 0; i < data.sensors.length; i++) {
    tasks.push(
      (function () {
        var sensor = new Sensor(data.sensors[i]);
        return function (cb) {
          sensor.save(cb);
        }
      })()
    )
  }

  async.parallel(tasks, function (err, results) {
    data.sensors = results.map(function (el) {return el[0]._id});
    var device = new Device(data);
    device.save(cb);
  })
}

DeviceSchema.statics.updateById = function (id, item, cb) {
  /*
   * Updates Device and its sensors. 
   * It does not delete omitted sensors
  */
  this.findById(id, function (err, device) {
    if (device) {
      if (item.serial != device.serial) {
        device.serial = item.serial;
      }
      device.gps = item.gps;
      device.location = item.location;
      for (var i = 0; i < item.sensors.length; i++) {
        Sensor.findById(item.sensors[i], function (err, sensor) {
          if (sensor) {
            sensor.type = item.sensors[i].type;
            sensor.devid = item.sensors[i].devid;
            sensor.save();
          } else {
            new Sensor(item.sensors[sensor]).save(function (err, sensor) {
              device.sensors.push(sensor.id);
            })
          }
        })
      }
      device.save(cb);
    } else {
      cb(err, device);
    }
  })
}

var Device = mongoose.model('Device', DeviceSchema);
var Sensor = mongoose.model('Sensor', SensorSchema);
var Data = mongoose.model('Data', DataSchema);

module.exports = {
  Device: Device, 
  Sensor: Sensor, 
  Data: Data
};
