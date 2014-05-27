
"use strict";

process.env.NODE_ENV = 'test';
/*global describe,before,beforeEach,afterEach,it*/

var app = require('../app'),
  request = require('supertest'),
  moment = require('moment'),
  should = require('should'),
  trigger = require('../triggers/sensor-trigger'),
  async = require('async'),
  device_sample = require('./data/device-sample'),
  sensor_sample_data = require('./data/sensor-sample-data'),
  new_sensor_sample_data = require('./data/new-sensor-sample-data'),
  trigger_sample = require('./data/trigger-sample'),
  fired_trigger_sample = require('./data/fired-trigger-sample'),
  new_trigger_sample = require('./data/new-trigger-sample'),
  radius_trigger_sample = require('./data/radius-trigger-sample'),
  user_sample = require('./data/user-sample'),
  Device = require('../models/devices').Device,
  Trigger = require('../models/triggers').Trigger,
  TriggerHistory = require('../models/triggers').TriggerHistory,
  User = require('../models/users').User,
  Sensor = require('../models/devices').Sensor,
  Data = require('../models/devices').Data,
  Config = require('../models/configs').Config,
  e;

describe('Sensor trigger system', function () {
  var that = this;

  before(function (done) {

    console.log("\n\nTESTING SENSOR TRIGGER SYSTEM\n");
    app.redisClient.flushall();

    async.waterfall([
      function (cb) {
        Data.remove(cb);
      },
      function (err, item, cb) {
        User.remove(cb);
      },
      function (err, item, cb) {
        Sensor.remove(cb);
      },
      function (err, item, cb) {
        Trigger.remove(cb);
      },
      function (err, item, cb) {
        Device.remove(cb);
      },
      function (err, item, cb) {
        TriggerHistory.remove(cb);
      },
      function (err, item, cb) {
        var user = new User(user_sample);
        user.save(function (err, item) {
          cb(err, item);
        });
      },
      function (item, cb) {
        Device.fullSave(device_sample, cb);
      },
      function (item, cb) {
        var device = new Device(item);
        device.populate('sensors', cb);
      },
      function (item, cb) {
        that.device = item;
        that.sensor = that.device.sensors[0];
        e = new trigger.SensorTrigger(that.sensor);
        cb(null);
      },
      function (cb) {
        that.trigger = new Trigger(trigger_sample);
        that.trigger._sensor.id = that.sensor.id;
        that.trigger.save(function (err) {
          cb(err);
        });
      },
      function (cb) {
        Config.findByRef(that.sensor.id, cb);
      },
      function (item, cb) {
        that.config = item;
        that.data = sensor_sample_data.map(function (el) {
          return {
            '_sensor': that.sensor.id,
            'at': el.at,
            'value': el.value
          };
        });
        Data.create(that.data, cb);
      }],
      done
      );
  });

  afterEach(function (done) {
    // update config to its default
    e.config = that.config.config.triggers.onNewData;
    Config.updateByRef(
      that.sensor.id,
      {config: app.envConfig.triggers.sensor},
      done
    );
  });

  it('emits onNewData from sensor :id, checks triggered', function (done) {
    e.emit("onNewData", that.data);
    e.once("ack", function () {
      e.data.should.eql(that.data);
      e.fired.length.should.eql(1);
      TriggerHistory.find(function (err, triggers) {
        triggers.length.should.eql(1);
        triggers[0].trigger._id.should.eql(that.trigger._id);
        done(err);
      });
    });
  });

  it('changes trigger and emits onNewData, checks nonTriggered', function (done) {
    that.trigger.update({"threshold": 5}, function () {
      e.emit("onNewData", that.data);
      e.once("ack", function () {
        e.fired.length.should.eql(0);
        that.trigger.update({"threshold": 3}, done);
      });
    });
  });

  it('adds a radius trigger and emits onNewData, fired once', function (done) {
    var radius_trigger = new Trigger(radius_trigger_sample);
    var data = JSON.parse(JSON.stringify(that.data));
    data[3].value = data[2].value * (1 + radius_trigger.threshold / 100) + 1;

    radius_trigger._sensor.id = that.sensor.id;
    radius_trigger.save(function () {
      e.emit("onNewData", data);
      e.once("ack", function () {
        e.fired.length.should.eql(2);
        e.fired[1].value.should.eql(data[3].value);
        radius_trigger.remove(done);
      });
    });
  });

  it('adds a trigger and emits onNewData, fired twice', function (done) {
    var new_trigger = new Trigger(new_trigger_sample);
    new_trigger._sensor.id = that.sensor.id;
    new_trigger.save(function (err, item) {
      e.emit("onNewData", that.data);
      e.once("ack", function () {
        e.fired.length.should.eql(2);
        new_trigger.remove(done);
      });
    });
  });

  it('sends new data to sensor and checks stored data', function (done) {
    e.emit("onNewData", that.data);
    e.once("ack", function () {
      Data.find({'_sensor': that.sensor}, function () {
        done();
      });
    });
  });

  it('tests consecutive data above threshold, fired once', function (done) {
    var duplicated = JSON.parse(JSON.stringify(that.data));
    duplicated[2].value = duplicated[3].value = 100;

    e.emit("onNewData", duplicated);
    e.once("ack", function () {
      e.fired.length.should.eql(1);
      done();
    });
  });

  it('tests non consecutive data above threshold, fired twice', function (done) {
    var duplicated = JSON.parse(JSON.stringify(that.data));
    duplicated[0].value = duplicated[3].value = 100;

    e.emit("onNewData", duplicated);
    e.once("ack", function () {
      e.fired.length.should.eql(2);
      done();
    });
  });

  it('tests sendProfile system', function (done) {
    e.config.onNearby = "sendProfile";
    e.sensor = that.sensor;
    e.data = that.data;

    e.emit("getNearUsers");
    e.once("storeData", function (chunk) {
      JSON
        .parse(chunk)[0]
        .profile.preferences
        .display.screenEnhancement
        .tracking.should.equal("mouse");
    }).once("ack", done);
  });
});

describe('Sensor Trigger Api', function () {
  var that = this;

  before(function (done) {

    console.log("\n\nTESTING SENSOR TRIGGER API\n");
    app.redisClient.flushall();

    async.waterfall([
      function (cb) {
        Data.remove(cb);
      },
      function (err, item, cb) {
        User.remove(cb);
      },
      function (err, item, cb) {
        Sensor.remove(cb);
      },
      function (err, item, cb) {
        Trigger.remove(cb);
      },
      function (err, item, cb) {
        Device.remove(cb);
      },
      function (err, item, cb) {
        TriggerHistory.remove(cb);
      },
      function (err, item, cb) {
        var user = new User(user_sample);
        user.save(function (err, item) {
          cb(err, item);
        });
      },
      function (item, cb) {
        Device.fullSave(device_sample, cb);
      },
      function (item, cb) {
        var device = new Device(item);
        device.populate('sensors', cb);
      },
      function (item, cb) {
        that.device = item;
        that.sensor = that.device.sensors[0];
        trigger_sample._sensor = that.sensor.id;
        new_trigger_sample._sensor = that.sensor.id;
        cb(null);
      },
      function (cb) {
        that.trigger = new Trigger(trigger_sample);
        that.trigger._sensor.id = that.sensor.id;
        that.trigger.save(function (err, item) {
          cb(err);
        });
      }],
      done
      );
  });

  it('creates a new trigger', function (done) {
    request(app)
      .post('/sensors/' + that.sensor.id + '/triggers/')
      .set('Accept', 'application/json')
      .send(new_trigger_sample)
      .expect(200, function (err, res) {
        res.body.should.containEql(new_trigger_sample);
        done();
      });
  });

  it('creates trigger, raises error for unexistent sensor', function (done) {
    request(app)
      .post('/sensors/' + 'inexistent-sensor' + '/triggers/')
      .set('Accept', 'application/json')
      .send(new_trigger_sample)
      .expect(404, function (err, res) {
        done();
      });
  });

  it('gets a trigger from :id', function (done) {
    request(app)
      .get('/triggers/' + that.trigger.id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.containEql(that.trigger_sample);
        done();
      });
  });

  it('gets triggers from sensor :id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/triggers')
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.should.be.an.instanceOf(Array);
        done();
      });
  });

  it('searches triggers from sensor :id', function (done) {
    request(app)
      .get('/sensors/' + that.sensor.id + '/triggers'
           + '?operator=' + trigger_sample.operator)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body[0].should.containEql(trigger_sample);
        done();
      });
  });

  it('deletes triggers from sensor :id', function (done) {
    request(app)
      .del('/triggers/' + that.trigger.id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        Trigger.findById(that.trigger.id, function (err, item) {
          should.not.exist(item);
          should.not.exist(err);
          done();
        });
      });
  });
});

describe('Sensor History Trigger Api', function () {
  var that = this;

  before(function (done) {

    console.log("\n\nTESTING SENSOR HISTORY TRIGGER API\n");
    app.redisClient.flushall();

    async.waterfall([
      function (cb) {
        Data.remove(cb);
      },
      function (err, item, cb) {
        User.remove(cb);
      },
      function (err, item, cb) {
        Sensor.remove(cb);
      },
      function (err, item, cb) {
        Trigger.remove(cb);
      },
      function (err, item, cb) {
        Device.remove(cb);
      },
      function (err, item, cb) {
        TriggerHistory.remove(cb);
      },
      function (err, item, cb) {
        var user = new User(user_sample);
        user.save(function (err, item) {
          cb(err, item);
        });
      },
      function (item, cb) {
        Device.fullSave(device_sample, cb);
      },
      function (item, cb) {
        var device = new Device(item);
        device.populate('sensors', cb);
      },
      function (item, cb) {
        that.device = item;
        that.sensor = that.device.sensors[0];
        trigger_sample._sensor = that.sensor.id;
        new_trigger_sample._sensor = that.sensor.id;
        cb(null);
      },
      function (cb) {
        that.firedTrigger = new TriggerHistory(fired_trigger_sample);
        that.firedTrigger._sensor.id = that.sensor.id;
        that.firedTrigger.save(function (err, item) {
          cb(err);
        });
      }],
      done
      );
  });

  it('gets a fired trigger from :id', function (done) {
    request(app)
      .get('/fired-triggers/' + that.firedTrigger.id)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body.value.should.eql(that.firedTrigger.value);
        res.body.trigger.should.eql(that.firedTrigger.trigger);
        done();
      });
  });

  it('searches fired triggers', function (done) {
    request(app)
      .get('/fired-triggers' + '?value=' + that.firedTrigger.value)
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        res.body[0].value.should.eql(that.firedTrigger.value);
        done();
      });
  });

  it('gets triggers from sensor :id & date :start to :end', function (done) {

    var  start = moment(that.firedTrigger.at).subtract(1000),
      end = moment(that.firedTrigger.at).add(1000);

    request(app)
      .get('/sensors/' + that.sensor.id + '/fired-triggers/date/' +
           start.toISOString() + '/' + end.toISOString())
      .expect('Content-type', /json/)
      .expect(200, function (err, res) {
        var at = moment(res.body[0].at);

        (at - start).should.be.above(0);
        (end - at).should.be.above(0);
        done();
      });
  });
});

