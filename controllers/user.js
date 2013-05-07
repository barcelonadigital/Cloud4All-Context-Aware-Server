/**
 * User API routes.
**/


var app = require('../app') 
  , User = require('../models/users').User
  , trigger = require('../triggers/user-trigger');

exports.get = function (req, res, next) {
  /**
   * Get user from database
  **/
  var id = req.params.id;

  User.findById(id, function (err, item){
    if (err) {
      next(err);
    } else if (item) {
      res.send(item);
    } else {
      res.send(404);
    }
  })
}

exports.search = function (req, res, next) {
  /**
   * Gets user from query search 
  **/
  var query = req.query;
  var uuid = query['uuid'] || null;
  if (uuid) {
    User.findByUuid(uuid, function (err, item) {
      if (err) {
        next(err);
      } else if (item) {
        res.send(item);
      } else {
        res.send(404);
      }
    })
  } else {
    res.send(404);
  }
}

exports.post = function (req, res, next) {
  /**
   * Posts new user returning user with id
  **/
  var item = req.body
    , user = new User(item);

  user.save(function (err, user) {
    if (err) {
      next(err);
    } else {
      var e = new trigger.UserTrigger(user);
      e.emit("onNewUser");
      res.send(user);
    }
  }) 
}

exports.update = function (req, res, next) {
  /**
   * Updates an existing user id, returning user;
  **/
  var item = req.body
    , id = req.params.id;

  User.findByIdAndUpdate(id, item, function (err, item) {
    if (err) {
      console.log(err);
      next(err);
    } else if (item) {
      res.send(item);
    } else {
      res.send(404);
    }
  })
}

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
      })
    } else {
      res.send(404);
    }
  }) 
}