/**
 * Device API routes.
**/

"use strict";

var app = require('../app'),
  trigger = require('../triggers/sensor-trigger'),
  Device = require("../models/devices").Device;

exports.get = function (req, res, next) {
  /**
   * Gets device from database
  **/

  var id = req.params.id,
    populate = req.query.populate || false,
    query = null;

  query = Device.findById(id);

  if (populate) {
    query.populate({path: 'sensors'});
  }

  query.exec(function (err, item) {
    if (err) {
      next(err);
    } else if (item) {
      res.send(item);
    } else {
      res.send(404);
    }
  });
};

exports.search = function (req, res, next) {
  /**
   * search devices from database
  **/

  var q = req.query || {},
    populate = req.query.populate || false,
    query = null;

  if (populate) {
    delete q.populate;
  }

  query = Device.find(q);

  if (populate) {
    query.populate({path: 'sensors'});
  }

  query.exec(function (err, devices) {
    if (err) {
      next(err);
    } else if (devices.length > 0) {
      res.send(devices);
    } else {
      res.send(404);
    }
  });
};

exports.post = function (req, res, next) {
  /**
   * Posts new device returning device with id
  **/

  var item = req.body,
    e = new trigger.SensorTrigger();

  Device.fullSave(item, function (err, device) {
    if (err) {
      next(err);
    } else {
      e.emit("onNewDevice", device.id);
      res.send(device);
    }
  });
};

exports.update = function (req, res, next) {
  /**
   * Updates new device returning device with id.
   * It does not delete existing devices/sensors
  **/
  var item = req.body,
    id = req.params.id;

  Device.updateById(id, item, function (err, device) {
    if (err) {
      next(err);
    } else if (device) {
      res.send(device);
    } else {
      res.send(404);
    }
  });
};

exports.remove = function (req, res, next) {
  /**
   * Deletes device from database
  **/

  var id = req.params.id;

  Device.findById(id, function (err, device) {
    if (err) {
      next(err);
    } else if (device) {
      device.remove(function (err) {
        if (err) {
          next(err);
        } else {
          res.send(device);
        }
      });
    } else {
      res.send(404);
    }
  });
};
