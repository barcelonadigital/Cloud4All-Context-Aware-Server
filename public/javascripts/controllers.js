'use strict';

/*globals angular*/

/* Controllers */

angular.module('casApp.controllers', []).
  controller('StreamCtrl', ['$scope', '$routeParams', 'socket', function (sc, params, socket) {

    sc.sensor = params.id;
    sc.data = [];

    socket.emit('subscribe', params.id);
    socket.on('data', function (data) {
      sc.data.push(data.data);
    });

  }]).

  controller('IndexCtrl', ['$scope', '$http', function (sc, http) {
    http.get('/sensors/').success(function (data, status, headers, config) {
      sc.sensors = data;
    });
  }]);
