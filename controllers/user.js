/**
 * User API routes.
**/

"use strict";

var app = require('../app'),
  User = require('../models/users').User,
  trigger = require('../triggers/user-trigger');

exports.get = function (req, res, next) {
  /**
   * Get user from database
  **/
  var id = req.params.id;

  User.findById(id, function (err, item) {
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
   * Gets user from query search
  **/

  var q = req.query || {},
    query = null;

  query = User.find(q);

  query.exec(function (err, users) {
    if (err) {
      next(err);
    } else if (users.length > 0) {
      res.send(users);
    } else {
      res.send(404);
    }
  });
};

exports.post = function (req, res, next) {
  /**
   * Posts new user returning user with id
  **/
  var item = req.body,
    user = new User(item);

  user.save(function (err, user) {
    if (err) {
      next(err);
    } else {
      var e = new trigger.UserTrigger(user);
      e.emit("onNewUser");
      res.send(user);
    }
  });
};

exports.update = function (req, res, next) {
  /**
   * Updates an existing user id, returning user;
  **/
  var item = req.body,
    id = req.params.id;

  User.findByIdAndUpdate(id, item, function (err, user) {
    if (err) {
      console.log(err);
      next(err);
    } else if (user) {
      var e = new trigger.UserTrigger(user);
      e.emit("onNewUser");
      res.send(user);
    } else {
      res.send(404);
    }
  });
};

exports.remove = function (req, res, next) {
  /**
   * Deletes an existing user
  **/
  var id = req.params.id;

  User.findById(id, function (err, user) {
    if (err) {
      next(err);
    } else if (user) {
      user.remove(function (err) {
        if (err) {
          next(err);
        } else {
          res.send(user);
        }
      });
    } else {
      res.send(404);
    }
  });
};
