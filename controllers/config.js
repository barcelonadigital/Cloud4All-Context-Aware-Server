/**
 * Configuration System API routes.

 config = {
  'id': 'base',
  'triggers.onNewData.data': 'raw',
  'triggers.onNewData.threshold': '10',
  'triggers.scheduler.data': 'mean',
  'triggers.scheduler.time': '60',
  'client.url': 'http://flowmanager/data',
 }
**/


var app = require('../app')
  , Config = require("../models/configs").Config;


exports.get = function (req, res, next) {
  /**
   * Get a config json from external reference id 
  **/
  var id = req.params.id;

  Config.findByRef(id, function (err, item) {
    if (err) {
      next(err);
    } else if (item) {
      res.send(item);
    } else {
      res.send(404);
    }
  })
}

exports.post = function (req, res, next) {
  /**
   * Posts new config returning config with id
  **/
  var item = req.body
    , config = new Config(item);
    
  config.save(function (err) {
    if (err) {
      next(err);
    } else {
      res.send(config);
    }
  }) 
}

exports.update = function (req, res, next) {
  /**
   * Updates a config system 
  **/
  var item = req.body
    , id = req.params.id;

  Config.updateByRef(id, item, function (err, config) {
    if (err) {
      next(err)
    } else if (config) {
      res.send(config);
    } else {
      res.send(404);
    }
  })
}
