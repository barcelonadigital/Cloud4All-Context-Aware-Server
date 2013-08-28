'use strict';

/*globals angular*/

/* Directives */

angular.module('casApp.directives', []).
  directive('appVersion', ['version', function (version) {
    return function (scope, elm, attrs) {
      elm.text(version);
    };
  }]);