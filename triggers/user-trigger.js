var util = require('util')
  , http = require('http')
  , querystring = require('querystring')
  , events = require('events')
  , app = require('../app')
  , utils = require('../utils/utils')
  , agg = require('../utils/aggregation')
  , User = require('../models/users').User
  , Config = require('../models/configs').Config;


function UserTrigger(user) {
  this.userClass = {'entityName': 'user'};
  this.configClass = {'entityName': 'config'};
  this.user = user;

  this.on("onNewUser", this.getUserConfig); 
  this.on("rightNow", this.rightNow); 

  events.EventEmitter.call(this);
}

util.inherits(UserTrigger, events.EventEmitter);

UserTrigger.prototype.getUserConfig = function (trigger) {
  var that = this
    , trigger = "onNewUser"; 

  var callBack = function (err, config) {
    config = config.config;
    that.receiver = config.receiver;
    that.config = config.triggers[trigger];
    that.emit(that.config.trigger);
  }

  that.user.getConfig(callBack);
}

UserTrigger.prototype.rightNow = function () {
  var that = this;
}

module.exports.UserTrigger = UserTrigger;
