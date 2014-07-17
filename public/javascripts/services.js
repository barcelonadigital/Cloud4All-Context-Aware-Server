'use strict';

/*jslint browser: true*/
/*global angular, $, app, io*/

/* Services */


angular.module('casApp.services', ['ngResource']).
  // Socket connection
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

  //sensor api
  factory('sensor', ['$resource', function ($resource) {
    return $resource('/sensors/:id/');
  }]).

  //trigger api
  factory('trigger', ['$resource', function ($resource) {
    return $resource('/triggers/:id/', {id: '@_id'}, {
      'create': {method: 'POST', url: '/sensors/:sensorId/triggers/'},
      'query': {method: 'GET', url: '/sensors/:sensorId/triggers/', isArray: true},
    });
  }]).

  //trigger history api
  factory('fired', ['$resource', function ($resource) {
    return $resource('/fired-triggers/:id/', {id: '@_id'}, {
      'lapse': {method: 'GET', url: '/sensors/:sensorId/fired-triggers/date/:start/:end', isArray: true},
    });
  }]).

  //home api
  factory('home', ['$resource', function ($resource) {
    return $resource('/homes/:id/');
  }]).

  //data api
  factory('data', ['$resource', function ($resource) {
    return $resource('/sensors/:id/data/');
  }]);

//external library dependencies
angular.module('casApp.libs', [])
  // Underscore
  .factory('_', function () {
    return window._;
  })
  // D3
  .factory('d3', function () {
    return window.d3;
  })
  // Moment
  .factory('moment', function () {
    return window.moment;
  });
