/**
 * Device API routes.
**/

"use strict";

var app = require('../app'),
Home = require("../models/homes").Home;

exports.get = function (req, res, next) {
  /**
   * Gets Home from database
  **/
  var id = req.params.id;

  Home.findById(id, function (err, item) {
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
   * search homes from database
  **/
  var q = req.query || {};

  Home.find(q, function (err, homes) {
    if (err) {
      next(err);
    } else if (homes.length > 0) {
      res.send(homes);
    } else {
      res.send(404);
    }
  });
};

exports.post = function (req, res, next) {
  /**
   * Posts new home returning home with id
  **/
  var item = req.body,
    home = new Home(item);
  
  home.save(function (err) {
    if (err) {
      next(err);
    } else {
      res.send(home);
    }
  });  
};	

exports.remove = function (req, res, next) {
  /**
   * Deletes home from database
  **/
  var id = req.params.id;

  Home.findById(id, function (err, home) {
    if (err) {
      next(err);
    } else if (home) {
      home.remove(function (err) {
        if (err) {
          next(err);
        } else {
          res.send(home);
        }
      });
    } else {
      res.send(404);
    }
  });
};