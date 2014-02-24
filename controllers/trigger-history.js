/**
 * Trigger API routes.
**/

"use strict";

var app = require('../app'),
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
   * Search triggers from database
  **/

  var q = req.query || {};

  TriggerHistory.find(q, function (err, item) {
    if (err) {
      next(err);
    } else if (item.length > 0) {
      res.send(item);
    } else {
      res.send(404);
    }
  });
};

exports.getTime = function (req, res, next) {
  /**
   * gets new fired triggers from start datetime to end datetime
   * in iso format if param ?start and ?end. It gets new data if param
  **/
  var id = req.params.id,
    start = req.params.start || null,
    end = req.params.end || null;

  if (!start || !end) {
    return res.send(new Error('start and end dates are required'));
  }

  start = new Date(start);
  end = new Date(end);

  if (!start || !end) {
    res.send(new Error('Incompatible start or end date ISO-8601 format'));
  } else {
    TriggerHistory.getTime(id, start, end, function (err, items) {
      if (err) {
        next(err);
      } else {
        res.send(items);
      }
    });
  }
};

