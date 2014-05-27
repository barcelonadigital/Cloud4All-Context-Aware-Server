/**
 * Sensor API routes.
**/

'use strict';

var app = require('../app'),
  trigger = require('../triggers/sensor-trigger'),
  sensorClass = {'entityName': 'sensor'},
  Data = require('../models/devices').Data,
  Sensor = require('../models/devices').Sensor;


exports.get = function (req, res, next) {
  /**
   * Gets sensor from database
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
   * search sensors from database
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
  */

  var id = req.params.id,
    data = req.body,
    series = [],
    e;

  Sensor.findById(id, function (err, sensor) {
    if (err) {
      next(err);
    } else if (sensor) {
      series = data.map(function (el) {
        return {
          '_sensor': sensor.id,
          'at': el.at,
          'value': el.value
        };
      });

      e = new trigger.SensorTrigger(sensor);
      e.emit('onNewData', series);
      res.send();
    } else {
      res.send(404);
    }
  });
};

exports.searchData = function (req, res, next) {
  /**
   * gets new data from start datetime to end datetime
   * in iso format if param ?start and ?end. It gets new data if param
   * q='new', otherwise it sends all data.
  **/
  var id = req.params.id,
    query = req.query.q || 'all',
    start = req.query.start || null,
    end = req.query.end || null,
    getData = null;

  query = start && end ? 'time' : query;

  var callback = function (err, data, next) {
    if (err) {
      next(err);
    } else {
      res.send(data);
    }
  };

  switch (query) {
  case 'all':
    Data.getAll(id, callback);
    break;

  case 'last':
    Data.getLast(id, callback);
    break;

  case 'time':
    start = new Date(start);
    end = new Date(end);
    if (!start || !end) {
      res.send(new Error('Incompatible start or end date ISO-8601 format'));
    } else {
      Data.getTime(id, start, end, callback);
    }
    break;

  default:
    res.send(new Error('Incorrect query parameter ' + query));
  }
};


