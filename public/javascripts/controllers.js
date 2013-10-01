'use strict';

/*globals angular*/

/* Controllers */

angular.module('casApp.controllers', []).
  controller('StreamCtrl', ['$scope', '$routeParams', 'socket', function (sc, params, socket) {

    sc.sensor = params.id;
    sc.data = [];

    socket.connect('/stream');
    socket.emit('subscribe', params.id);
    socket.on('data', function (el) {
      sc.data.push(el);
    });
  }]).

  controller('DashBoardCtrl', ['$scope', 'sensor', 'socket', function (sc, sensor, socket) {

    sc.data = {};
    socket.connect('/dashboard');

    sc.sensors = sensor.query({'populate': true}, function () {
      socket.emit('subscribe', sc.sensors.map(function (el) {
        return el._id;
      }));
    });

    socket.on('data', function (el) {
      var i = 0,
        last = {};

      for (i = 0; i < sc.sensors.length; i++) {
        if (sc.sensors[i]._id === el.id) {
          sc.sensors[i]._last = sc.sensors[i]._last || last;
          sc.sensors[i]._last.at = el.at;
          sc.sensors[i]._last.value = el.value;
          break;
        }
      }
    });
  }]);
