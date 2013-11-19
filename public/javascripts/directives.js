'use strict';

/*globals angular*/

/* Directives */

angular.module('casApp.directives', []).
  directive('lineChart', ['d3', '_', 'moment', function (d3, _, moment) {
    var margin = {top: 10, right: 10, bottom: 100, left: 40};
    var margin2 = {top: 430, right: 10, bottom: 20, left: 40};

    return {
      restrict: 'E',
      replace: true,
      scope: {
        data: '=',
        stream: '=',
        start: '=',
        end: '=',
        period: '@',
        unit: '@',
        sensor: '@',
        width: '@',
        height: '@'
      },
      template: '<div class="line-chart"></div>',
      controller:'DataCtrl',
      link: function (scope, element) {
        var height = scope.height - margin.top - margin.bottom,
          width = scope.width - margin.left - margin.right;

        scope.updateTime();

        var x = d3.time.scale().domain([
            scope.start, scope.end]).range([0, width]);
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
          .attr('height', scope.height);

        var xAxis = d3.svg.axis().scale(x).tickSize(height).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).orient('left');

        var focus = graph.append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        focus.append('g')
          .attr('class', 'x axis')
          .attr('tranform', 'translate(0,' + height + ')')
          .call(xAxis);

        focus.append('g')
          .attr('class', 'y axis')
          .call(yAxis);

        focus.append('path')
          .data([scope.data])
          .attr('d', line)
          .attr('class', 'line');

        function updateGraph () {
           // update x axis
          x.domain([scope.start, scope.end]);
          xAxis.scale(x);
          graph.selectAll('g.x.axis').call(xAxis);

          // update y axis
          y.domain([
            d3.min(scope.data, function (d) {return d.value; }),
            d3.max(scope.data, function (d) {return d.value; })
          ]);

          yAxis.scale(y);
          graph.selectAll('g.y.axis').call(yAxis);

          //update line
          graph.selectAll('path.line')
            .data([scope.data])
            .attr('d', line);

        }

        scope.$watch('data', function () {
          var last = scope.data.length > 0 ? moment(_.last(scope.data).at) : null;

          if (last && last > scope.end) {
            scope.updateTime(last, moment(last).add(scope.unit, scope.period));
            scope.data = [_.last(scope.data)];
          }
          updateGraph();
        });
      }
    };
  }]).

  directive('paginator', function () {
    return {
      controller: 'DataCtrl',
      restrict: 'E',
      template: '<button class="forward" ng-disabled="stream" ng-click="forward()">Page up</button>' +
                '<button class="back" ng-click="back()">Page down</button>'
    };
  });
