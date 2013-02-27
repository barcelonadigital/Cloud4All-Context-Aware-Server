 /**
 * Redis Cache Manager
 */

var utils = require('../utils/utils')
  , async = require('async') 
  , uuid = require('node-uuid');

function CacheRedis(conn, log, defaultExpireSeconds) {
  if (!conn || !log) {
    throw new Error("Connection param and Log are required")
  }

  this.connection = conn;
  this.log = log;
  this.expireSeconds = defaultExpireSeconds || 60;

}

CacheRedis.prototype.postUuid = function(itemClass, item, next) {
  /**
   * Posts a uuid, id = key, value for searching by uuid.
  **/
  var that = this;

  if (!item.uuid || !utils.UUIDCheck(item.uuid)) {
    next(new Error("uuid does not comply with uuid standards: " + item.uuid));
  } else {
    var cacheKeyUuid = itemClass.entityName + ':' + item.uuid;
    that.log("cache putItem(): key = " + cacheKeyUuid);
    that.connection.exists(cacheKeyUuid, function(err, res) {
      if (!res) {
        that.connection.set(cacheKeyUuid, item.id, function(err) {
          next(err);
        })
      } else {
        next(new Error("uuid key already exists in database :" + item.uuid));
      }
    })
  }
}

CacheRedis.prototype.getItem = function(itemClass, id, next) {
  /**
   * Gets item from id 
  **/
  var that = this;
  var cacheKeyId = itemClass.entityName + ':' + id;

  that.log("cache getItem(): id = " + id);
  that.connection.hgetall(cacheKeyId, function(err, item) {
    next(err, item);
  })
}

CacheRedis.prototype.delUuid = function(itemClass, uuid, next) {
  /**
   * Deletes uuid, ik pairs from cache
  */
  var that = this;

  if (!uuid || !utils.UUIDCheck(uuid)) {
    next(new Error("uuid does not comply with uuid standards: " + uuid));
  } else {
    var cacheKeyUuid = itemClass.entityName + ":" + uuid;
    that.connection.del(cacheKeyUuid, function(err) {
      next(err);
    })
  } 
}

CacheRedis.prototype.updateItem = function(itemClass, item, id, next) {
  /**
   * Updates exisiting Item: 
   * In order to search by uuid: store uuid if exists 
   * We need to get the item first (to delete uuid if needed)
  **/
  var that = this
    , oldItem = {}
    , newItem = item
    , cacheKeyId = itemClass.entityName + ":" + id;

  newItem.id = id;

  async.waterfall([
    function(callback) {
      that.getItem(itemClass, id, function(err, res) {
        callback(err, res);
      })
    },
    function(res, callback) {
      oldItem = res;
      newItem.uuid = utils.UUIDCheck(newItem.uuid) ? newItem.uuid : oldItem.uuid;

      that.delUuid(itemClass, oldItem.uuid, function(err) {
        callback(err);
      })
    },
    function(callback) {
      that.log("cache updateItem(): key = " + cacheKeyId);
      that.connection.hmset(cacheKeyId, newItem, function(err) {
        callback(err);
      })
    },
    function(callback) { 
      that.postUuid(itemClass, newItem, function(err) {
        callback(err, newItem);
      })
    },
  ], function (err, res) {
    next(err, res);
  });
}

CacheRedis.prototype.postItem = function(itemClass, item, next) {
  /**
   * Posts a new item to Redis cache. If id in item, uses its id.
   * It can 
  **/

  var that = this
    , newItem = item
    , newId = item.id || null
    , cacheKey = itemClass.entityName;

  async.waterfall([
    function(callback) {
      if (newId) {
        that.connection.hexists(cacheKey, newId, function(err, exists) {
          callback(exists ? new Error("Error New Item id already exist " + newId) : err, newId);
        })
      } else {
        that.connection.incr(cacheKey, function(err, id) {
          callback(err, id);
       })
      }
    },
    function(id, callback) {
      newItem.id = id.toString();
      newItem.uuid = utils.UUIDCheck(newItem.uuid) ? newItem.uuid : uuid.v4();

      that.postUuid(itemClass, newItem, function(err){
        callback(err); 
      })
    },
    function(callback) {
      var cacheKeyId = itemClass.entityName + ':' + newItem.id;
      that.log("cache postItem(): key = " + cacheKeyId);
      that.connection.hmset(cacheKeyId, newItem, function(err) {
        callback(err, newItem);
      })
    }
  ], function(err, res) {
    // If error after id increment, decrements id again
    if (err && newItem.id && !newId) {
      that.connection.decr(cacheKey)
    }
    next(err, res);
  });
}

CacheRedis.prototype.getHashItem = function(itemClass, id, key, next) {
  /**
   * Gets item from id 
  **/
  var that = this
    , cacheKeyId = itemClass.entityName + ':' + id
    , cacheHashId = key; 

  that.log("cache getHashItem(): [id, key] = " + id + ", " + key);
  that.connection.hget(cacheKeyId, cacheHashId, function(err, item) {
    next(err, item);
  })
}

CacheRedis.prototype.updateHashItem = function(itemClass, id, key, value, next) {
  /**
   * Gets item from id 
  **/
  var that = this
    , cacheKeyId = itemClass.entityName + ':' + id;

  that.log("cache updateHashItem(): [id, key] = " + id + ", " + key);
  that.getHashItem(itemClass, id, key, function(err, item) {
    if (item) {
      that.connection.hset(cacheKeyId, key, value, function(err, res) {
        next(err, value);
      })
    } else {
      next(err || new Error("Error getting hash key: " + key));
    }
  })
}

CacheRedis.prototype.getItemFromUuid = function(itemClass, uuid, next) {
  /**
   * Gets item from uuid 
  **/
  var that = this
    , cacheKeyUuid = itemClass.entityName + ':' + uuid;

  if (utils.UUIDCheck(uuid)) {
    that.log("cache getItem(): uuid = " + uuid);
    that.connection.get(cacheKeyUuid, function(err, id) {
      if (err) {
        next(err);
      } else {
        that.getItem(itemClass, id, next);
      }
    })
  } else {
    next(new Error("uuid does not comply uuid standard " + uuid));
  }
}

CacheRedis.prototype.postData = function(itemClass, id, data, next) {
  /**
  * Posts new data from itemclass id
  */
  var that = this
    , cacheKeyData = itemClass.entityName + ':' + id + ':data';

  that.log("cache postData(): id = " + id);
  that.getItem(itemClass, id, function (err, reply){
    if (err) {
      next(err);
    } else {
      that.connection.rpush(cacheKeyData, data, function(err) {
        next(err);
      })
    }
  })
}

CacheRedis.prototype.getData = function(itemClass, id, start, end, next) {
  /**
   * Gets data from start to end itemclass id
  **/

  var that = this
    , cacheKeyData = itemClass.entityName + ':' + id + ':data'
    , start = start || 0
    , end = end || -1;

  that.log("cache getData(): id = " + id);
  that.getItem(itemClass, id, function(err, reply) {
    if (err) {
      next(err);
    } else {
      that.connection.lrange(cacheKeyData, start, end, function (err, reply) {
        next(err, reply.join(','));
      })
    }
  })
}

CacheRedis.prototype.getAllData = function(itemClass, id, next) {
  /**
   * Gets all data from itemclass id
  **/
  this.getData(itemClass, id, 0, -1, next);
}

CacheRedis.prototype.getNewData = function(itemClass, id, next) {
  /**
   * Gets new data from itemclass id
  **/
  this.getData(itemClass, id, -1, -1, next);
}

module.exports.CacheRedis = CacheRedis;
