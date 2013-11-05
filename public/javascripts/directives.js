'use strict';

/*globals angular*/

/* Directives */

angular.module('casApp.directives', []).
  directive('lineChart', ['d3', '_', 'moment', function (d3, _, moment) {

    var margin = {top: 20, right: 10, bottom: 20, left: 30};

    return {
      restrict: 'E',
      replace: true,
      scope: {
        data: '=',
        startTime: '=',
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
            d3.min(scope.data, function (d) {return d.value; }),
            d3.max(scope.data, function (d) {return d.value; })
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
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

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
          //check data scope
          var last = scope.data.length > 0 ? moment(_.last(scope.data).at) : null;
          var first = scope.data.length > 0 ? moment(_.first(scope.data).at) : null;

          if (last && last > endTime) {
            startTime = last;
            endTime = moment(startTime).add(timeUnit, timePeriod);
            scope.data = [_.last(scope.data)];
          }

          // update x axis
          x.domain([startTime, endTime]);
          xAxis.scale(x);
          graph.selectAll('g.x.axis').call(xAxis);

          // update y axis
          y.domain([
            d3.min(scope.data, function (d) {return d.value; }),
            d3.max(scope.data, function (d) {return d.value; })
          ]);
          yAxis.scale(y);
          graph.selectAll('g.y.axis').call(yAxis);

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