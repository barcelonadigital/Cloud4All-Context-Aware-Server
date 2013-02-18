 /**
 * Redis Cache Manager
 */

var utils = require('../utils/utils');

function CacheRedis(conn, log, defaultExpireSeconds) {
  if (!conn || !log) {
    throw new Error("Connection param and Log are required")
  }

  this.connection = conn;
  this.log = log;
  this.expireSeconds = defaultExpireSeconds || 60;

}

CacheRedis.prototype.postItem = function(itemClass, item, next) {

  var that = this;
  var cacheKeyUuid = itemClass.entityName + ":" + item.uuid;
  var cacheKeyId = itemClass.entityName + ":" + item.id;

  this.log("cache putItem(): key = " + cacheKeyUuid);
  this.connection.set(cacheKeyUuid, item.id, function(err) {
    if (err) {
      that.log("Error: putItem() uuid: " + err);
      next(err, item);
    }
  })

  this.log("cache putItem(): key = " + cacheKeyId);
  this.connection.hmset(cacheKeyId, item, function(err) {
    if (err) {
      that.log("Error: putItem() item: " + err);
    }
    if (next) {
      next(err, item);
    }
    return item;
  })
}

CacheRedis.prototype.getItem = function(itemClass, id, next) {
  /**
   * Get item from id 
  **/
  var that = this;
  var cacheKeyId = itemClass.entityName + ':' + id;

  this.log("cache getItem(): id = " + id);
  this.connection.hgetall(cacheKeyId, function(err, item) {
    if (err) {
      that.log("Error: getItem() id: " + err);
    } 
    if (next) {
      next(err, item);
    }
    return item;
  })
}

CacheRedis.prototype.getItemFromUuid = function(itemClass, uuid, next) {
  /**
   * Get item from uuid 
  **/
  var that = this; 
  var cacheKeyUuid = itemClass.entityName + ':' + uuid;

  if (utils.UUIDCheck(uuid)) {
    this.log("cache getItem(): uuid = " + uuid);
    this.connection.get(cacheKeyUuid, function(err, id) {
      if (err) {
        that.log("Error: getItemFromUuid() uuid: " + err);
        if (next) {
          next(error);
        }
      } else {
        var item =  that.getItem(itemClass, id, next);
        return item;
      }
    })
  } else {
    next(new Error("getItemFromUuId(): uuid does not comply uuid standard " + uuid));
  }
}

CacheRedis.prototype.postData = function(itemClass, id, data, next) {
  /**
  * Post new data from itemclass id
  */
  var that = this;
  var cacheKeyData = itemClass.entityName + ':' + id + ':data';

  this.getItem(itemClass, id, function (err, reply){
    if (err) {
      next(err);
    } else {
      that.connection.rpush(cacheKeyData, data, function(err) {
        if (err) {
          that.log("Error: postData(): " + err);
        } 
        if (next) {
          next(err);
        }
      })
    }
  })
  return id;
}

CacheRedis.prototype.getData = function(itemClass, id, next) {
  /**
   * Get all data from itemclass id
  **/

  var that = this;
  var cacheKeyData = itemClass.entityName + ':' + id + ':data';

  this.getItem(itemClass, id, function(err, reply) {
    if (err) {
      next(err);
    } else {
      that.connection.lrange(cacheKeyData, 0, -1, function (err, reply) {
        if (err) {
          that.log("Error: getData(): " + err);
        }
        if (next) {
          next(err, reply);
        }
        return reply;
      })
    }
  })
}

module.exports.CacheRedis = CacheRedis;
