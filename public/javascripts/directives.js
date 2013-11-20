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
          height2 = scope.height - margin2.top - margin2.bottom,
          width = scope.width - margin.left - margin.right;

        scope.updateTime();

        var x = d3.time.scale()
          .domain([scope.start, scope.end])
          .range([0, width]);

        var x2 = d3.time.scale()
          .domain(x.domain())
          .range([0, width]);

        var min = d3.min(scope.data, function (d) {return d.value; })
        var max = d3.max(scope.data, function (d) {return d.value; })
        var thres = Math.abs(max-min);

        var y = d3.scale.linear()
          .domain([min - thres, max + thres])
          .range([height, 0]);

        var y2 = d3.scale.linear()
          .domain(y.domain())
          .range([height2, 0]);

        var line = d3.svg.line()
          .x(function (d) {
            return x(moment(d.at));
          })
          .y(function (d) {
            return y(d.value);
          });

        var line2 = d3.svg.line()
          .x(function (d) {
            return x2(moment(d.at));
          })
          .y(function (d) {
            return y2(d.value);
          });

        var graph = d3.select(element[0])
          .append('svg:svg')
          .attr('width', scope.width)
          .attr('height', scope.height);

        var xAxis = d3.svg.axis().scale(x).orient('bottom'),
          xAxis2 = d3.svg.axis().scale(x2).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).orient('left');

        var brush = d3.svg.brush()
          .x(x2)
          .on("brush", brushed);

        var defs = graph.append("defs").append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", width)
          .attr("height", height);

        var focus = graph.append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var context = graph.append('g')
          .attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')');

        focus.append('path')
          .attr("clip-path", "url(#clip)")
          .data([scope.data])
          .attr('d', line)
          .attr('class', 'line');

        focus.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        focus.append('g')
          .attr('class', 'y axis')
          .call(yAxis);

        context.append('path')
          .data([scope.data])
          .attr('d', line2)
          .attr('class', 'line');

        context.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height2 + ')')
          .call(xAxis2);

        context.append('g')
          .attr('class', 'x brush')
          .call(brush)
          .selectAll('rect')
          .attr('y', -6)
          .attr('height', height2 + 7);

        function brushed() {
          x.domain(brush.empty() ? x2.domain() : brush.extent());
          focus.select('path.line').attr('d', line);
          focus.select('.x.axis').call(xAxis);
        }

        function updateGraph () {
           // update x axis
          x.domain([scope.start, scope.end]);
          x2.domain([scope.start, scope.end]);
          xAxis.scale(x);
          xAxis2.scale(x2);

          focus.selectAll('g.x.axis').call(xAxis);
          context.selectAll('g.x.axis').call(xAxis2);

          // update y axis
          var min = d3.min(scope.data, function (d) {return d.value; })
          var max = d3.max(scope.data, function (d) {return d.value; })
          var thres = Math.abs(max-min);

          y.domain([min - thres, max + thres]);
          y2.domain([min - thres, max + thres]);

          yAxis.scale(y);

          focus.selectAll('g.y.axis').call(yAxis);

          //update line
          focus.selectAll('path.line')
            .data([scope.data])
            .attr('d', line);

          context.selectAll('path.line')
            .data([scope.data])
            .attr('d', line2);
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
