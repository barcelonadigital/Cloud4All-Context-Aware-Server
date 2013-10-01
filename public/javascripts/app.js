'use strict';

/*globals angular*/

/* Main App */

angular.module('casApp', [
  'casApp.controllers',
  'casApp.filters',
  'casApp.services',
  'casApp.directives'
]).
  config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/partials/dashboard',
        controller: 'DashBoardCtrl'
      }).
      when('/stream/:id', {
        templateUrl: '/partials/stream',
        controller: 'StreamCtrl'
      }).
      otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  }]);
