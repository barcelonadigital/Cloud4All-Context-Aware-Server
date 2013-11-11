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
        stream: '=',
        sensor: '@',
        period: '@',
        unit: '@',
        width: '@',
        height: '@'
      },
      controller: ['$scope', 'data', function (sc, data) {
        sc.updateTime = function (start, end) {
          sc.start = start || sc.start || moment();
          sc.end = end || moment(sc.start).add(sc.unit, sc.period);
        };

        sc.updateData = function() {
          var last = sc.data.length > 0 ? moment(_.last(sc.data).at) : null;

          if (last && last > sc.end) {
            sc.updateTime(last, moment(last).add(sc.unit, sc.period));
            sc.data = [_.last(sc.data)];
          }
        };

        sc.forward = function () {
          var now = moment();
          sc.stream = false;

          if (sc.end < now) {
            sc.end.add(sc.unit, sc.period);
            sc.start.add(sc.unit, sc.period);
          } 

          if (sc.end > now) {
            sc.stream = true;
          }

          data.query({
            sensorid: sc.sensor, 
            start: sc.start.toISOString(), 
            end: sc.end.toISOString()}, function (data) {
              sc.data = data;
          });
        };

        sc.back = function () {
          sc.stream = false;

          sc.end.subtract(sc.unit, sc.period);
          sc.start.subtract(sc.unit, sc.period);

          data.query({
            sensorid: sc.sensor,
            start: sc.start.toISOString(), 
            end: sc.end.toISOString()}, function (data) {
              sc.data = data;
          });
        };
      }],
      link: function (scope, element) {
        var  height = scope.height - margin.top - margin.bottom,
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
          .attr('height', scope.height)
          .append('svg:g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var xAxis = d3.svg.axis().scale(x).tickSize(height).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).orient('left');

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

        scope.$watch('data', function () {
          scope.updateData();

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
        });
      }
    };
  }]).

  directive('paginator', function () {
    return {
      require: '^lineChart',
      restrict: 'E',
      link: function (scope, element) {
        scope.$watch('stream', function () {
          if (scope.stream) {
            element.children('.forward').addClass('disabled');
          } else {
            element.children('.forward').removeClass('disabled');
          }
        });
      },
      template: '<button class="forward" ng-click="forward()">Page up</button>' +
                '<button class="back" ng-click="back()">Page down</button>'
    };
  });
