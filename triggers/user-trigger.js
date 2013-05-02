var util = require('util')
  , http = require('http')
  , querystring = require('querystring')
  , events = require('events')
  , app = require('../app')
  , utils = require('../utils/utils')
  , agg = require('../utils/aggregation')
  , User = require('../models/users').User
  , Config = require('../models/configs').Config;


function UserTrigger(userClass, configClass) {
  this.on("onNewUser", this.getUserConfig); 

  events.EventEmitter.call(this);
}

util.inherits(UserTrigger, events.EventEmitter);

UserTrigger.prototype.getUserConfig = function (user, trigger) {
  var that = this;

  that.trigger = trigger || "onNewUser";
  that.user = user;

  var callBack = function (err, config) {
    config = config.config;
    that.receiver = config.receiver;
    that.config = config.triggers[that.trigger];
    that.emit(that.config.data, user);
  }

  that.user.getConfig(callBack);
}

module.exports.UserTrigger = UserTrigger;
