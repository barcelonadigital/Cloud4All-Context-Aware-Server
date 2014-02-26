'use strict';

/*globals angular,moment */

/* Controllers */

angular.module('casApp.controllers', []).
  controller('StreamCtrl', ['$scope', '$routeParams', 'data', 'socket', function (sc, params, data, socket) {
    sc.sensor = params.id;
    sc.data = [];
    sc.trigger = [];
    sc.stream = true;

    socket.connect('/stream');
    socket.emit('subscribe', params.id);

    socket.on('data', function (el) {
      if (sc.stream && el.id === sc.sensor) {
        sc.data = sc.data.concat(el.data);
      }
    });

    socket.on('trigger', function (el) {
      if (sc.stream && el.id === sc.sensor) {
        sc.trigger = sc.trigger.concat(el.data);
      }
    });
  }]).

  controller('DataCtrl', ['$scope', 'data', 'triggerHistory', function (sc, data, trigger) {
    sc.unit = 'minutes';
    sc.period = '1';

    sc.scales = [
      {name: '1 minute', sample: 'raw', unit: 'minutes', period: '1'},
      {name: '5 minutes', sample: 'raw', unit: 'minutes', period: '5'},
      {name: '30 minutes', sample: 'raw', unit: 'minutes', period: '30'},
      {name: '1 hour', sample: 'raw', unit: 'hours', period: '1'},
      {name: '6 hours', sample: 'averaged', unit: 'hours', period: '6'},
      {name: '1 day', sample: 'averaged', unit: 'days', period: '1'},
      {name: '7 days', sample: 'averaged', unit: 'days', period: '7'},
      {name: '1 month', sample: 'averaged', unit: 'months', period: '1'},
      {name: '3 months', sample: 'averaged', unit: 'months', period: '3'}
    ];

    sc.scale = sc.scales[0];

    sc.updateTime = function (start, end) {
      sc.start = start || sc.start || moment();
      sc.end = end || moment(sc.start).add(sc.unit, sc.period);
    };

    sc.updateData = function () {
      data.query({
        id: sc.sensor,
        start: sc.start.toISOString(),
        end: sc.end.toISOString()
      }, function (data) {
        sc.data = data;
      });
    };

    sc.updateTrigger = function () {
      trigger.query({
        id: sc.sensor,
        start: sc.start.toISOString(),
        end: sc.end.toISOString()
      }, function (trigger) {
        sc.trigger = trigger;
      });
    };

    sc.forward = function () {
      var now = moment();
      sc.stream = false;

      if (sc.end < now) {
        sc.end.add(sc.unit, sc.period);
        sc.start.add(sc.unit, sc.period);
      }

      if (sc.end > now) {
        sc.stream = true;
      }
      sc.updateData();
    };

    sc.back = function () {
      sc.stream = false;

      sc.end.subtract(sc.unit, sc.period);
      sc.start.subtract(sc.unit, sc.period);
      sc.updateData();
    };

    sc.$watch('scale', function () {
      sc.unit = sc.scale.unit;
      sc.period = sc.scale.period;

      sc.updateTime();
      sc.updateData();
    });

  }]).

  controller('DashBoardCtrl', ['$scope', 'sensor', 'socket', '_', function (sc, sensor, socket, _) {

    sc.data = {};
    sc.trigger = {};
    socket.connect('/dashboard');

    sc.sensors = sensor.query({'populate': true}, function () {
      socket.emit('subscribe', sc.sensors.map(function (el) {
        return el._id;
      }));
    });

    socket.on('data', function (el) {
      _.find(sc.sensors, function (sensor) {
        return sensor._id === el.id;
      })._last = el.data;
    });

    socket.on('trigger', function (el) {
      sc.trigger[el.id] = el.data;
    });
  }]);
