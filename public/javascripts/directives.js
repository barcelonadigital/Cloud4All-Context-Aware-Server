'use strict';

/*globals angular*/

/* Directives */

angular.module('casApp.directives', []).
  directive('lineChart', ['d3', '_', 'moment', function (d3, _, moment) {

    var margin = {top: 10, right: 10, bottom: 100, left: 40},
      margin2 = {top: 430, right: 10, bottom: 20, left: 40};

    var toFloat = function (value) {
      switch (value) {
      case 'true':
        return 1;
      case 'false':
        return 0;
      default:
        return parseFloat(value);
      }
    };

    return {
      restrict: 'E',
      replace: true,
      scope: {
        data: '=',
        fired: '=',
        start: '=',
        end: '=',
        period: '@',
        unit: '@',
        sensor: '@',
        width: '@',
        height: '@'
      },
      template: '<div class="line-chart"></div>',
      controller: 'DataCtrl',
      link: function (scope, element) {
        var height = scope.height - margin.top - margin.bottom,
          height2 = scope.height - margin2.top - margin2.bottom,
          width = scope.width - margin.left - margin.right;

        var bisectDate = d3.bisector(function (d) {
          return moment(d.at);
        }).left;

        var formatData = function (d) {
          return d.at.format("dddd, MMMM Do YYYY, h:mm:ss a") + ', ' + d.value;
        };

        var getYDomain = function (scope) {
          var formatValue = function (d) {return toFloat(d.value); };

          var min = d3.min(scope.data, formatValue);
          var max = d3.max(scope.data, formatValue);
          var thres = Math.abs(max - min);

          thres = thres > 0 ? thres : min * 20 / 100;
          return [min - thres, max + thres];
        };

        scope.updateTime();

        var x = d3.time.scale()
          .domain([scope.start, scope.end])
          .range([0, width]);

        var x2 = d3.time.scale()
          .domain(x.domain())
          .range([0, width]);

        var y = d3.scale.linear()
          .domain(getYDomain(scope))
          .range([height, 0]);

        var y2 = d3.scale.linear()
          .domain(y.domain())
          .range([height2, 0]);

        var line = d3.svg.line()
          .interpolate('step-after')
          .x(function (d) {
            return x(moment(d.at));
          })
          .y(function (d) {
            return y(toFloat(d.value));
          });

        var line2 = d3.svg.line()
          .interpolate('step-after')
          .x(function (d) {
            return x2(moment(d.at));
          })
          .y(function (d) {
            return y2(toFloat(d.value));
          });

        var graph = d3.select(element[0])
          .append('svg')
          .attr('width', scope.width)
          .attr('height', scope.height);

        var xAxis = d3.svg.axis().scale(x).orient('bottom'),
          xAxis2 = d3.svg.axis().scale(x2).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).orient('left');

        graph.append('defs').append('clipPath')
          .attr('id', 'clip')
          .append('rect')
          .attr('width', width)
          .attr('height', height);

        var focus = graph.append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var context = graph.append('g')
          .attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')');

        var tip = focus.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        var brush = d3.svg.brush()
          .x(x2)
          .on('brush', brushed);

        focus.append('g')
          .data([scope.data])
          .attr('clip-path', 'url(#clip)')
          .append('path')
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

        tip.append('line')
          .attr('class', 'x');

        tip.append('line')
          .attr('class', 'y')
          .attr('x1', width - 6)
          .attr('x2', width + 6);

        tip.append('circle')
          .attr('class', 'y')
          .attr('r', 4);

        tip.append('text')
          .attr('class', 'y')
          .attr('dy', '-1em');

        focus.append('rect')
          .attr('class', 'overlay')
          .attr('width', width)
          .attr('height', height)
          .on('mouseover', function () {
            tip.style('display', null);
          })
          .on('mouseout', function () {
            tip.style('display', 'none');
          })
          .on('mousemove', mousemove);

        function mousemove() {

          var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(scope.data, x0, 1),
            d0 = scope.data[i - 1],
            d1 = scope.data[i];

          if (d0 && d1) {
            var d = x0 - d0.at > d1.at - x0 ? d1 : d0;

            d.at = moment(d.at);

            tip.select('circle.y')
              .attr('transform', 'translate(' + x(d.at) + ',' + y(toFloat(d.value)) + ')');
            tip.select('text.y')
              .attr('transform', 'translate(' + x(d.at) + ',' + y(toFloat(d.value)) + ')')
              .text(formatData(d));
            tip.select('.x')
              .attr('transform', 'translate(' + x(d.at) + ',0)');
            tip.select('.y')
              .attr('transform', 'translate(' + width * -1 + ', ' + y(toFloat(d.value)) + ')')
              .attr('x', width + x(d.at));
          }
        }

        function brushed() {
          x.domain(brush.empty() ? x2.domain() : brush.extent());
          focus.select('path.line').attr('d', line);
          focus.selectAll('circle')
            .attr('clip-path', 'url(#clip)')
            .attr("cx", function (d) { return x(moment(d.at)); })
            .attr("cy", function (d) { return y(toFloat(d.value)); });
          focus.select('.x.axis').call(xAxis);
        }

        function updateGraph() {
          // update x axis
          x.domain([scope.start, scope.end]);
          x2.domain([scope.start, scope.end]);
          xAxis.scale(x);
          xAxis2.scale(x2);

          focus.selectAll('g.x.axis').call(xAxis);
          context.selectAll('g.x.axis').call(xAxis2);

          // update y axis
          y.domain(getYDomain(scope));
          y2.domain(y.domain());
          yAxis.scale(y);

          focus.selectAll('g.y.axis').call(yAxis);

          //update line
          focus.selectAll('path.line')
            .data([scope.data])
            .attr('d', line);

          var circles = focus.selectAll('circle')
            .data(scope.fired);

          circles
            .attr("cx", function (d) { return x(moment(d.at)); })
            .attr("cy", function (d) { return y(toFloat(d.value)); })
            .enter()
              .append('circle')
              .attr('clip-path', 'url(#clip)')
              .attr('cx', function (d) { return x(moment(d.at)); })
              .attr('cy', function (d) { return y(toFloat(d.value)); })
              .attr('r', 5);

          circles.exit().remove();

          context.selectAll('path.line')
            .data([scope.data])
            .attr('d', line2);

          tip.select('line.x')
            .attr('y1', y.range()[0] - 6)
            .attr('y2', y.range()[0] + 6);

        }

        scope.$watch('fired', function () {
          updateGraph();
        });

        scope.$watch('data', function () {
          var last = scope.data.length > 0 ? moment(_.last(scope.data).at) : null;

          if (last && last > scope.end) {
            scope.updateTime(last, moment(last).add(scope.unit, scope.period));
            scope.updateFired(last, moment(last).add(scope.unit, scope.period));

            scope.data = [_.last(scope.data)];
            scope.fired = [];
          }

          if (!_.isEmpty(scope.data)) {
            updateGraph();
          }
        });
      }
    };
  }]).directive('paginator', function () {
    return {
      controller: 'DataCtrl',
      restrict: 'E',
      template: '<button class="forward" ng-disabled="stream" ng-click="forward()">Page up</button>' +
                '<button class="back" ng-click="back()">Page down</button>'
    };
  }).

  directive('triggerList', function () {
    return {
      controller: 'TriggerCtrl',
      restrict: 'E',
      templateUrl: '/templates/triggers'
    };
  })

  .directive('floorPlan', ['d3','_', function (d3, _) {
    return {
      restrict: 'E',
      scope: {
	  sensors: '='
      },
      link: function (scope, element) {
	function updateHeatmap() {
	    // console.log("updateHeatmap");
      function is_on(d) {
          if (d._last.value>=10) {
              return true;
          } else {
              return false;
          }
      }
	    var sensors = scope.sensors;
	    var graph = d3.select(element[0]).selectAll('.room').data(scope.sensors);
	    graph.enter().append("p").attr("class", "room").style("background-color", "white");
      graph.text(function(d) {return "Sensor id: " + d._id + "\nValue: " + d._last.value;});
      graph.transition()
          .duration(function(d){
              if(is_on(d)) {return 1000;}
              else {return 3000;}
          })
          .style("background-color", function(d){
              if(is_on(d)) {return "#E21403";}
              else {return "white";}
          });
      graph.exit().remove();

	};

        scope.$watch('sensors', function () {
          if (!_.isEmpty(scope.sensors)) {
            updateHeatmap();
          }
        }, true);

      }
    };
  }]);
