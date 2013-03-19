/**
 * User API routes.

 user = {
  'gps': [111,222,333],
  'profile': {"preferences": {"display": {"screenEnhancement": {"magnification": 2,"tracking": "mouse",
                "applications": [{"name": "GNOME Shell Magnifier","id": "org.gnome.desktop.a11y.magnifier",
                        "priority": 100,"parameters": {"show-cross-hairs": true}}]}}}}
  'id':1,
  'uuid': '550e8400-e29b-41d4-a716-446655440000',
 }
**/


var app = require('../app') 
  , trigger = require('../triggers/user-trigger')
  , CacheRedis = require('../managers/cache-redis').CacheRedis
  , cache = new CacheRedis(
      app.redisClient, 
      app.logmessage)
  , userClass= {'entityName': 'user'};

exports.get = function (req, res, next) {
  /**
   * Get user from Redis database
  **/
  var id = req.params.id;

  cache.getItem(userClass, id, function (err, item){
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
    cache.getItemFromUuid(userClass, uuid, function (err, item) {
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
      , e = new trigger.UserTrigger();


  item.profile = JSON.stringify(item.profile);

  cache.postItem(userClass, item, function (err, item) {
    if (err) {
      next(err);
    } else {
      e.emit("onNewUser", item.id, "onNewUser");
      item.profile = JSON.parse(item.profile);
      res.send(item);
    }
  })
}

exports.update = function (req, res, next) {
  /**
   * Updates an existing user id, returning user;
  **/
  var item = req.body
    , id = req.params.id;

  item.profile = JSON.stringify(item.profile);

  cache.updateItem(userClass, item, id, function (err, item) {
    if (err) {
      next(err);
    } else {
      item.profile = JSON.parse(item.profile);
      res.send(item);
    }
  })
}
