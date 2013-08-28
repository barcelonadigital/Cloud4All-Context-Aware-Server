/**
 * Sensor API routes.
**/

"use strict";

var app = require('../app'),
  trigger = require('../triggers/sensor-trigger'),
  CacheRedis = require('../managers/cache-redis').CacheRedis,
  cache = new CacheRedis(
    app.redisClient,
    app.logmessage
  ),
  sensorClass = {'entityName': 'sensor'},
  Sensor = require("../models/devices").Sensor;


exports.get = function (req, res, next) {
  /**
   * Gets device from database
  **/
  var id = req.params.id;

  Sensor.findById(id, function (err, item) {
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

  var query = req.query || {};

  Sensor.find(query, function (err, sensors) {
    if (err) {
      next(err);
    } else if (sensors.length > 0) {
      res.send(sensors);
    } else {
      res.send(404);
    }
  });
};

exports.postData = function (req, res, next) {
  /**
   * Posts new data from sensor id
  **/
  var id = req.params.id,
    data = req.body,
    e;

  cache.postData(sensorClass, id, data, function (err) {
    if (err) {
      next(err);
    } else {
      Sensor.findById(id, function (err, sensor) {
        if (err) {
          next(err);
        } else if (sensor) {
          e = new trigger.SensorTrigger(sensor);
          e.emit("onNewData");
          res.send();
        } else {
          res.send(404);
        }
      });
    }
  });
};

exports.getData = function (req, res, next) {
  /**
   * Gets all data from sensor id
  **/
  var id = req.params.id,
    query = req.query.q || "all",
    getData = null;

  switch (query) {
  case "all":
    cache.get = cache.getAllData;
    break;
  case "new":
    cache.get = cache.getNewData;
    break;
  default:
    getData = function () {
      res.send(new Error("Incorrect query parameter " + query));
    };
  }

  cache.get(sensorClass, id, function (err, reply, next) {
    if (err) {
      next(err);
    } else {
      res.send({data: reply});
    }
  });
};
