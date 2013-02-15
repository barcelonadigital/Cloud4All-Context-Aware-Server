/**
 * Sensor API routes.

 sensor = {
 	'gps': [111,222,333],
 	'type': 'light',
 	'id':1,
 	'uuid': '550e8400-e29b-41d4-a716-446655440000',
 	'data': ["1,2,3,4,5,6", "1,2,3,4,5,6"]
 }
**/

var redis = require('redis')
	, utils = require('../utils/utils')
  , db = redis.createClient();


exports.getSensor = function(req, res, next) {
	/**
	 * Get sensor from Redis database
	**/
	var id = req.params.id;

	var getId = function(id) {
		db.hgetall('sensor:' + id, function(err, reply) {
			if (err) {
				next(err);
			} else if (reply) {
				req.reply = reply;
				next();
			} else {
				res.send(404);
			}
		});
	};

	if (utils.UUIDCheck(id)) {
		db.get('sensor:' + id, function(err, newid) {
			if (err) {
				next(err);
			} else {
				getId(newid);
			}
		});
	} else {
		getId(id);
	}
}

exports.get = function(req, res, next) {
	res.send(req.reply);
 };

exports.post = function(req, res, next) {
	/**
	 * Post or update sensor 
	**/
	var id = req.body.id;

	db.set("sensor:" + req.body.uuid, id, function(err) {
		if (err) {
			next(err);
		}
	});

	db.hmset(
			"sensor:" + id, "uuid", req.body.uuid, 
			"type", req.body.type, "gps" , req.body.gps, function(err) {
		if (err) {
			next(err);
		} else {
			res.send(200, {sensor: 'sensor:' + id});
		}
	});
};

exports.postData = function(req, res) {
	/**
	 * Post new data from sensor id
	**/
	var id = req.params.id
		, now = Date.now();

	db.rpush('sensor:'+ id + ':data', req.body, function(err) {
		if (err) {
			next(err);
		} else {
			res.send(200);
		}
	});
};

exports.getData = function(req, res) {
	/**
	 * Get all data from sensor id
	**/
	var id = req.params.id
		, now = Date.now();

	db.lrange('sensor:'+ id + ':data', 0, -1, function(err, reply) {
		if (err) {
			next(err);
		} else {
			res.send(200, {data: reply.join(',')});
		}
	});
};
