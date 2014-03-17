/**
 * Trigger API routes.
**/

"use strict";

var app = require('../app'),
  Sensor = require('../models/devices').Sensor,
  Trigger = require('../models/triggers').Trigger;

exports.get = function (req, res, next) {
  /**
   * Gets device from database
  **/
  var id = req.params.id;

  Trigger.findById(id, function (err, item) {
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

  Trigger.find(q, function (err, trigger) {
    if (err) {
      next(err);
    } else if (trigger.length > 0) {
      res.send(trigger);
    } else {
      res.send(404);
    }
  });
};

exports.post = function (req, res, next) {
  /**
   * Posts new trigger returning trigger with id
  **/

  var item = req.body,
    trigger = new Trigger(item);

  trigger.save(function (err) {
    if (err) {
      next(err);
    } else {
      res.send(trigger);
    }
  });
};

exports.update = function (req, res, next) {
  /**
   * Updates new trigger returning trigger with id.
   * It does not delete existing trigger/sensors
  **/
  var item = req.body,
    id = req.params.id;

  delete item._id;

  Trigger.findByIdAndUpdate(id, item, function (err, trigger) {
    if (err) {
      next(err);
    } else if (trigger) {
      res.send(trigger);
    } else {
      res.send(404);
    }
  });
};

exports.remove = function (req, res, next) {
  /**
   * Deletes trigger from database
  **/

  var id = req.params.id;

  Trigger.findById(id, function (err, trigger) {
    if (err) {
      next(err);
    } else if (trigger) {
      trigger.remove(function (err) {
        if (err) {
          next(err);
        } else {
          res.send(trigger);
        }
      });
    } else {
      res.send(404);
    }
  });
};

exports.searchBySensor = function (req, res, next) {
  /**
   * Search triggers from database
  **/

  var sensorId = req.params.sensorId,
    q = req.query || {};

  q._sensor = sensorId;

  Sensor.findById(sensorId, function (err, item) {
    if (err) {
      next(err);
    } else if (item) {
      Trigger.find(q, function (err, triggers) {
        if (err) {
          next(err);
        } else {
          res.send(triggers);
        }
      });
    } else {
      res.send(404);
    }
  });
};

exports.postBySensor = function (req, res, next) {
  /**
   * Posts new trigger returning trigger with id
  **/

  var sensorId = req.params.sensorId,
    item = req.body,
    trigger = new Trigger(item);

  trigger._sensor = sensorId;

  Sensor.findById(sensorId, function (err, item) {
    if (err) {
      next(err);
    } else if (item) {
      trigger.save(function (err) {
        if (err) {
          next(err);
        } else {
          res.send(trigger);
        }
      });
    } else {
      res.send(404);
    }
  });
};
