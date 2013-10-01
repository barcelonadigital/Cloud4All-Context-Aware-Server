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
  var id = req.params.id,
    populate = req.query.populate || false,
    query = null;

  query = Sensor.findById(id);

  if (populate) {
    query.populate({path: '_last', select: 'at value -_id'});
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

  query = Sensor.find(q);

  if (populate) {
    query.populate({path: '_last', select: 'at value -_id'});
  }

  query.exec(function (err, sensors) {
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

  cache.get(sensorClass, id, function (err, data, next) {
    if (err) {
      next(err);
    } else {
      res.send(data);
    }
  });
};

exports.searchData = function (req, res, next) {
  /**
   * gets new data from start datetime to end datetime
   * in iso format
  **/
  var id = req.params.id,
    start = req.params.start,
    end = req.params.end;

  start = (new Date(start)).getTime() || null;
  end = (new Date(end)).getTime() || null;

  if (!start || !end) {
    res.send(new Error('Incompatible start or end date ISO-8601 format'));
  }

  cache.getScoreData(sensorClass, id, start, end, function (err, data) {
    if (err) {
      next(err);
    } else {
      res.send(data);
    }
  });
};