 /**
 * Redis Cache Manager
 */

"use strict";

var utils = require('../utils/utils'),
  async = require('async'),
  uuid = require('node-uuid');

function CacheRedis(conn, log, defaultExpireSeconds) {
  if (!conn || !log) {
    throw new Error("Connection param and Log are required");
  }

  this.connection = conn;
  this.log = log;
  this.expireSeconds = defaultExpireSeconds || 60;

}

CacheRedis.prototype.postUuid = function (itemClass, item, next) {
  /**
   * Posts a uuid, id = key, value for searching by uuid.
  **/
  var that = this;

  if (!item.uuid || !utils.UUIDCheck(item.uuid)) {
    next(new Error("uuid does not comply with uuid standards: " + item.uuid));
  } else {
    var cacheKeyUuid = itemClass.entityName + ':' + item.uuid;
    that.log("cache postUuid(): key = " + cacheKeyUuid);
    that.connection.exists(cacheKeyUuid, function (err, res) {
      if (!res) {
        that.connection.set(cacheKeyUuid, item.id, function (err) {
          next(err);
        });
      } else {
        next(new Error("uuid key already exists in database :" + item.uuid));
      }
    });
  }
};

CacheRedis.prototype.getItem = function (itemClass, id, next) {
  /**
   * Gets item from id
  **/
  var that = this,
    cacheKeyId = itemClass.entityName + ':' + id;

  that.log("cache getItem(): id = " + id);
  that.connection.hgetall(cacheKeyId, function (err, item) {
    next(err, item);
  });
};

CacheRedis.prototype.delUuid = function (itemClass, uuid, next) {
  /**
   * Deletes uuid, ik pairs from cache
  */
  var that = this;

  if (!uuid || !utils.UUIDCheck(uuid)) {
    next(new Error("uuid does not comply with uuid standards: " + uuid));
  } else {
    var cacheKeyUuid = itemClass.entityName + ":" + uuid;
    that.log("cache delUuid(): uuid = " + uuid);
    that.connection.del(cacheKeyUuid, function (err) {
      next(err);
    });
  }
};

CacheRedis.prototype.updateItem = function (itemClass, item, id, next) {
  /**
   * Updates exisiting Item:
   * In order to search by uuid: store uuid if exists
   * We need to get the item first (to delete uuid if needed)
  **/
  var that = this,
    oldItem = {},
    newItem = JSON.parse(JSON.stringify(item)),
    cacheKeyId = itemClass.entityName + ":" + id;

  newItem.id = id;

  async.waterfall([
    function (callback) {
      that.getItem(itemClass, id, function (err, res) {
        callback(err, res);
      });
    },
    function (res, callback) {
      oldItem = res;
      newItem.uuid = utils.UUIDCheck(newItem.uuid) ? newItem.uuid : oldItem.uuid;

      that.delUuid(itemClass, oldItem.uuid, function (err) {
        callback(err);
      });
    },
    function (callback) {
      that.log("cache updateItem(): key = " + cacheKeyId);
      that.connection.hmset(cacheKeyId, newItem, function (err) {
        callback(err);
      });
    },
    function (callback) {
      that.postUuid(itemClass, newItem, function (err) {
        callback(err, newItem);
      });
    }
  ], function (err, res) {
    if (next) {
      next(err, res);
    }
  });
};

CacheRedis.prototype.postItem = function (itemClass, item, next) {
  /**
   * Posts a new item to Redis cache. If id in item, uses its id.
  **/

  var that = this,
    newItem = JSON.parse(JSON.stringify(item)),
    newId = item.id || null,
    cacheKey = itemClass.entityName;

  async.waterfall([
    function (callback) {
      if (newId) {
        that.connection.hexists(cacheKey, newId, function (err, exists) {
          callback(exists ? new Error("Error New Item id already exist " + newId) : err, newId);
        });
      } else {
        that.connection.incr(cacheKey, function (err, id) {
          callback(err, id);
        });
      }
    },
    function (id, callback) {
      newItem.id = id.toString();
      newItem.uuid = utils.UUIDCheck(newItem.uuid) ? newItem.uuid : uuid.v4();

      that.postUuid(itemClass, newItem, function (err) {
        callback(err);
      });
    },
    function (callback) {
      var cacheKeyId = itemClass.entityName + ':' + newItem.id;
      that.log("cache postItem(): key = " + cacheKeyId);
      that.connection.hmset(cacheKeyId, newItem, function (err) {
        callback(err, newItem);
      });
    }
  ], function (err, res) {
    // If error after id increment, decrements id again
    if (err && newItem.id && !newId) {
      that.connection.decr(cacheKey);
    }
    if (next) {
      next(err, res);
    }
  });
};

CacheRedis.prototype.getHashItem = function (itemClass, id, key, next) {
  /**
   * Gets item from id
  **/
  var that = this,
    cacheKeyId = itemClass.entityName + ':' + id,
    cacheHashId = key;

  that.log("cache getHashItem(): [id, key] = " + id + ", " + key);
  that.connection.hget(cacheKeyId, cacheHashId, function (err, item) {
    next(err, item);
  });
};

CacheRedis.prototype.updateHashItem = function (itemClass, id, key, value, next) {
  /**
   * Gets item from id
  **/
  var that = this,
    cacheKeyId = itemClass.entityName + ':' + id;

  that.log("cache updateHashItem(): [id, key] = " + id + ", " + key);
  that.getHashItem(itemClass, id, key, function (err, item) {
    if (item) {
      that.connection.hset(cacheKeyId, key, value, function (err, res) {
        next(err, value);
      });
    } else {
      next(err || new Error("Error getting hash key: " + key));
    }
  });
};

CacheRedis.prototype.getItemFromUuid = function (itemClass, uuid, next) {
  /**
   * Gets item from uuid
  **/
  var that = this,
    cacheKeyUuid = itemClass.entityName + ':' + uuid;

  if (utils.UUIDCheck(uuid)) {
    that.log("cache getItem(): uuid = " + uuid);
    that.connection.get(cacheKeyUuid, function (err, id) {
      if (err) {
        next(err);
      } else {
        that.getItem(itemClass, id, next);
      }
    });
  } else {
    next(new Error("uuid does not comply uuid standard " + uuid));
  }
};

CacheRedis.prototype.postData = function (itemClass, id, data, key, next) {
  /**
  * Posts new data from itemclass id
  * Data Series should be defined such as:
  * [
  *  {"at":"2013-04-22T00:35:43.12Z","value":"1"},
  *  {"at":"2013-04-22T00:55:43.73Z","value":"2"},
  *  {"at":"2013-04-22T01:15:43.28Z","value":"3"},
  *  {"at":"2013-04-22T01:35:43.56Z","value":"4"}
  * ]
  * It also stores last request date in :last key
  */

  var that = this,
    dataKey = (next === undefined) ? 'data' : key,
    params = [],
    cacheKeyData = itemClass.entityName + ':' + id + ':' + dataKey,
    cacheKeyLast = itemClass.entityName + ':' + id + ':last';

  next = (next === undefined) ? key : next;

  params = [cacheKeyData].concat(
    data.
      map(function (el) {
        return [(new Date(el.at)).getTime().toString(), JSON.stringify(el)];
      }).
      reduce(function (a, b) {
        return a.concat(b);
      })
  );

  that.log("cache postData(): key = " + cacheKeyData);

  that.connection.zadd(params, function (err) {
    if (err) {
      next(err);
    } else {
      that.connection.set(cacheKeyLast, data[0].at, function (err) {
        next(err);
      });
    }
  });
};

CacheRedis.prototype.getData = function (itemClass, id, start, end, key, next) {
  /**
   * Gets data from start position to end position from itemclass id
  **/

  var that = this,
    dataKey = (next === undefined) ? 'data' : key,
    cacheKeyData = itemClass.entityName + ':' + id + ':' +  dataKey;

  start = start || 0;
  end = end || -1;
  next = (next === undefined) ? key : next;

  that.log("cache getData(): id = " + id);
  that.connection.zrange(cacheKeyData, start, end, function (err, reply) {
    next(err, that.parseData(reply));
  });
};

CacheRedis.prototype.getScoreData = function (itemClass, id, start, end, key, next) {
  /**
   * Gets data from start date to end date from itemclass id
  **/

  var that = this,
    dataKey = (next === undefined) ? 'data' : key,
    cacheKeyData = itemClass.entityName + ':' + id + ':' +  dataKey;

  start = start || '-inf';
  end = end || '+inf';
  next = (next === undefined) ? key : next;

  that.log("cache getData(): id = " + id);
  that.connection.zrangebyscore(cacheKeyData, start, end, function (err, reply) {
    next(err, that.parseData(reply));
  });
};

CacheRedis.prototype.getAllData = function (itemClass, id, next) {
  /**
   * Gets all data from itemclass id
  **/
  this.getData(itemClass, id, 0, -1, next);
};

CacheRedis.prototype.getLastData = function (itemClass, id, next) {
  /**
   * Gets last data from itemclass id
  **/
  this.getData(itemClass, id, -1, -1, next);
};

CacheRedis.prototype.getNewData = function (itemClass, id, next) {
  /**
   * Gets last data sent using :last key where we store last request date
  **/
  var that = this,
    cacheKeyLast = itemClass.entityName + ':' + id + ':last';

  this.connection.get(cacheKeyLast, function (err, date) {
    if (date) {
      var timestamp = (new Date(date)).getTime();
      that.getScoreData(itemClass, id, timestamp, '+inf', next);
    } else {
      next(err);
    }
  });
};

CacheRedis.prototype.parseData = function (data) {
  return JSON.parse("[" + data.join(',') + "]");
};

module.exports.CacheRedis = CacheRedis;
