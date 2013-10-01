'use strict';

/*jslint browser: true*/
/*global angular, $, app, io*/

/* Services */


// Socket connection
angular.module('casApp.services', ['ngResource']).
  factory('socket', ['$rootScope', function ($rootScope) {
    var socket = io.connect();
    return {
      connect: function (nameSpace) {
        socket = io.connect(nameSpace);
      },
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      }
    };
  }]).

  factory('sensor', ['$resource', function ($resource) {
    return $resource('/sensors/:sensorid/');
  }]);
