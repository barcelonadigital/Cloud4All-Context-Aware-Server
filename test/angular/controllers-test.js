"use strict";

/*global chai, inject, angular,
  beforeEach, describe, before, it,
*/

var should = chai.should(),
  expect = chai.expect;

describe('Index Controller', function () {
  var scope,
    $httpBackend,
    $sensor;


  beforeEach(module('casApp.services'));
  beforeEach(module('casApp.controllers'));

  beforeEach(inject(function ($rootScope, $controller, _$httpBackend_, sensor) {
    scope = $rootScope.$new();
    $httpBackend = _$httpBackend_;
    $httpBackend.when('GET', '/sensors').respond([{
      id: 1,
      devid: 2,
      type: "light"
    }, {
      id: 3,
      devid: 4,
      type: "noise"
    }]);

    $controller('DashBoardCtrl', {$scope: scope, sensor: sensor});

  }));

  it('should be available',  inject(function ($rootScope, $httpBackend) {
    $httpBackend.flush();
    expect(scope.sensors.length).to.equal(2);
  }));
});
