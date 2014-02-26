/**
 * Trigger API routes.
**/

"use strict";

var app = require('../app'),
  Sensor = require('../models/devices').Sensor,
  TriggerHistory = require("../models/triggers").TriggerHistory;

exports.get = function (req, res, next) {
  /**
   * Gets device from database
  **/
  var id = req.params.id;

  TriggerHistory.findById(id, function (err, item) {
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
   * standard search and also if ?start and ?end
   * gets new fired triggers from start datetime to end datetime
   * in iso format if param ?start and ?end. It gets new data if param
  **/

  var q = req.query || {};

  TriggerHistory.find(q, function (err, items) {
    if (err) {
      res.send(err);
    } else {
      res.send(items);
    }
  });
};

exports.getTimeBySensor = function (req, res, next) {
  /**
   * standard search and also if ?start and ?end
   * gets new fired triggers from start datetime to end datetime
   * in iso format if param ?start and ?end. It gets new data if param
  **/

  var sensorId = req.params.sensorId,
    start = req.params.start || null,
    end = req.params.end || null;

  if (!start || !end) {
    res.send(new Error('start and end params required'));
    return;
  }

  start = new Date(start);
  end = new Date(end);

  if (!start || !end) {
    res.send(new Error('Incompatible start or end date ISO-8601 format'));
    return;
  }

  Sensor.findById(sensorId, function (err, item) {
    if (err) {
      res.send(err);
    } else if (item) {
      TriggerHistory.getTime(start, end, function (err, items) {
        if (err) {
          res.send(err);
        } else {
          res.send(items);
        }
      });
    } else {
      res.send(404);
    }
  });
};


