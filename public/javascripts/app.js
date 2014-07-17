'use strict';

/*globals angular*/

/* Main App */

angular.module('casApp', [
  'casApp.controllers',
  'casApp.filters',
  'casApp.services',
  'casApp.directives',
  'casApp.libs',
  'ngRoute'
]).
  config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/partials/dashboard',
        controller: 'DashBoardCtrl'
      }).
      when('/heatmap/:id', {
        templateUrl: '/partials/heatmap',
        controller: 'FloorPlanCtrl'
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
