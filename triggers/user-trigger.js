var util = require('util')
  , http = require('http')
  , querystring = require('querystring')
  , events = require('events')
  , app = require('../app')
  , utils = require('../utils/utils')
  , agg = require('../utils/aggregation')
  , CacheRedis = require('../managers/cache-redis').CacheRedis;

function UserTrigger(userClass, configClass) {
  this.userClass = userClass || {'entityName': 'user'};
  this.configClass = configClass || {'entityName': 'config'};
  this.cache = new CacheRedis(app.redisClient, app.logmessage);

  this.on("onNewUser", this.getUserConfig); 

  events.EventEmitter.call(this);
}

util.inherits(UserTrigger, events.EventEmitter);

UserTrigger.prototype.getUserConfig = function (user, trigger) {
  var that = this
    , userKeyId = that.userClass.entityName + ':' +user 
    , baseKeyId = "base";

  that.trigger = trigger || "onNewUser";
  that.id = user;

  var callBack = function (config) {
    config = utils.deepen(config);
    that.receiver = config.receiver;
    that.config = config.triggers[that.trigger];
    that.emit(that.config.data, user);
  }

  that.cache.getItem(that.configClass, userKeyId, function (err, config) {
    if (!config) {
      that.cache.getItem(that.configClass, baseKeyId, function (err, config) {
        callBack(config);
      })
    } else {
      callBack(config);
    } 
  })
}

module.exports.UserTrigger = UserTrigger;
