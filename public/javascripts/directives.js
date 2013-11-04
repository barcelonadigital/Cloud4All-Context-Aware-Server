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
        timePeriod: '@',
        timeUnit: '@',
        width: '@',
        height: '@'
      },
      link: function (scope, element, attrs) {
        var startTime = moment(scope.startTime),
          timePeriod = scope.timePeriod || '1',
          timeUnit = scope.timeUnit || 'hours',
          endTime = moment(startTime).add(timeUnit, timePeriod);

        var height = scope.height - margin.top - margin.bottom,
          width = scope.width - margin.left - margin.right;

        var x = d3.time.scale().domain([startTime, endTime]).range([0, width]);
        var y = d3.scale.linear().domain([
            d3.min(scope.data, function (d) {return d.value; }) || -10,
            d3.max(scope.data, function (d) {return d.value; }) || 20
          ]).range([height, 0]);

        var line = d3.svg.line()
          .x(function (d) {
            return x(moment(d.at));
          })
          .y(function (d) {
            return y(d.value);
          });

        var graph = d3.select(element[0])
          .append('svg:svg')
          .attr('width', scope.width)
          .attr('height', scope.height)
          .append('svg:g')
          .attr('transform', 'translate(' + margin.bottom + ',' + margin.top + ')');

        var xAxis = d3.svg.axis().scale(x).tickSize(height).tickSubdivide(1).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).ticks(6).orient('left');

        graph.append('g')
          .attr('class', 'x axis')
          .attr('tranform', 'translate(0,' + height + ')')
          .call(xAxis);

        graph.append('g')
          .attr('class', 'y axis')
          .call(yAxis);

        graph.append('path')
          .data([scope.data])
          .attr('d', line)
          .attr('class', 'line');

        function updateData() {

          var last = scope.data.length > 0 ? moment(_.last(scope.data).at) : null;

          if (last && last > endTime) {
            // update x axis
            startTime = last;
            endTime = moment(startTime).add(timeUnit, timePeriod);
            x.domain([startTime, endTime]);
            // reset data to last value
            scope.data = [_.last(scope.data)];
          }

          y.domain([
            d3.min(scope.data, function (d) {return d.value; }),
            d3.max(scope.data, function (d) {return d.value; })
          ]);

          graph.selectAll('path.line')
            .data([scope.data])
            .attr('d', line);
        }

        scope.$watch('data', function () {
          updateData();
        });
      }
    };
  }]);