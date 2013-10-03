'use strict';

/*globals angular*/

/* Controllers */

angular.module('casApp.controllers', []).
  controller('StreamCtrl', ['$scope', '$routeParams', 'socket', function (sc, params, socket) {

    sc.sensor = params.id;
    sc.data = [];
    sc.trigger = [];

    socket.connect('/stream');
    socket.emit('subscribe', params.id);
    socket.on('data', function (el) {
      sc.data.push(el);
    });

    socket.on('trigger', function (el) {
      sc.trigger.push(el);
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
