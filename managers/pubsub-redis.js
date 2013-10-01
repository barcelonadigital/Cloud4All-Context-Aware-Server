/**
 * Redis PubSub Manager
 */

"use strict";

var redis = require('redis');

/**
 * PubSub - Simple Redis Pub/Sub
 * @param options
 *          port - Redis Port
 *          host - Redis host
 *          connect_timeout - timeout
 *          max_attempts - max connection attempts
 *          pub - Redis pubClient
 *          sub - Redis subClient
 * @constructor
 */

function PubSub(options) {
  options = options || {};

  this.host = options && options.host ? options.host : '127.0.0.1';
  this.port = options && options.port ? options.port : 6379;

  this.redisOptions = {
    connect_timeout : options && options.connect_timeout ? options.connect_timeout : false,
    max_attempts : options && options.max_attempts ? options.max_attempts : false
  };

  this.pub = options.pub || redis.createClient(this.port, this.host, this.redisOptions);
  this.sub = options.sub || redis.createClient(this.port, this.host, this.redisOptions);

  this.clients = {};
}

PubSub.prototype.subscribe = function (channel, socket) {

  if (!(channel in this.clients)) {
    this.clients[channel] = [socket];

  } else if (this.clients[channel].indexOf(socket) === -1) {
    this.clients[channel].push(socket);
  }

  this.sub.subscribe(channel);

};

PubSub.prototype.unsubscribe = function (channel, socket) {

  if (channel in this.clients) {
    var index = this.clients[channel].indexOf(socket);
    if (index >= 0) {
      this.clients[channel].splice(index, 1);
      if (this.clients[channel].length === 0) {
        delete this.clients[channel];
        this.pub.unsubscribe(channel);
      }
    }
  }
};

PubSub.prototype.publish = function () {
  this.pub.publish.apply(this.pub, arguments);
};

module.exports.PubSub = PubSub;
