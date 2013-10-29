'use strict';

/*globals angular*/

/* Directives */

angular.module('casApp.directives', []).
  directive('lineChart', ['d3', '_', 'moment', function (d3, _, moment) {

    var margin = {top: 20, right: 10, bottom: 20, left: 10};

    return {
      restrict: 'E',
      replace: true,
      scope: {
        data: '=',
        startTime: '=',
        endTime: '=',
        period: '=',
        width: '@',
        height: '@'
      },
      link: function (scope, element, attrs) {

        scope.data = [
          {"at": "2013-10-10T15:32:02.051Z", "value": 2},
          {"at": "2013-10-10T15:32:03.052Z", "value": 3},
          {"at": "2013-10-10T15:32:04.053Z", "value": 10},
          {"at": "2013-10-10T15:32:05.054Z", "value": 1},
          {"at": "2013-10-10T15:32:06.054Z", "value": 2}
        ];

        var endTime = moment(scope.endTime),
          period = scope.period || 1,
          startTime = moment(endTime).subtract('days', period);

        var height = scope.height - margin.top - margin.bottom,
          width = scope.width - margin.left - margin.right;

        var x = d3.time.scale().domain([startTime, endTime]).range([0, width]);
        var y = d3.scale.linear().domain([
            d3.min(scope.data, function (d) {return d.value; }),
            d3.max(scope.data, function (d) {return d.value; })
          ]);

        var line = d3.svg.line()
          .x(function (d) {
            return x(d.at);
          })
          .y(function (d) {
            return y(d.value);
          });

        var graph = d3.select(element[0])
          .append('svg:svg')
          .attr('width', scope.width)
          .attr('height', scope.heigth)
          .append('svg:g')
          .attr('transform', 'translate(' + margin.bottom + ',' + margin.top + ')');

        var xAxis = d3.svg.axis().scale(x).tickSize(-height).tickSubdivide(1),
          yAxis = d3.svg.axis().scale(y).ticks(6).orient('left');

        graph.append('svg:g')
          .attr('class', 'x axis')
          .attr('tranform', 'translate(0,' + height + ')')
          .call(xAxis);

        graph.append('svg:g')
          .attr('class', 'y axis')
          .attr('tranform', 'translate(-10,0)')
          .call(yAxis);

        graph.append('svg:path')
          .attr('d', line(scope.data))
          .attr('class', 'data');

      }
    };
  }]);