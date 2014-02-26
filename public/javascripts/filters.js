'use strict';

/*globals angular*/

/* Filters */

angular.module('casApp.filters', []).
  filter('interpolate', ['version', function (version) {
    return function (text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]);
