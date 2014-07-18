'use strict';

/*globals angular,moment */

/* Controllers */

angular.module('casApp.controllers', []).
  controller('TriggerCtrl', ['$scope', 'trigger', '_', function (sc, trigger, _) {
    sc.operators = [
      {name: 'greater than', value: 'gt'},
      {name: 'greater than equal', value: 'gte'},
      {name: 'less than', value: 'lt'},
      {name: 'less than equal', value: 'lte'},
      {name: 'equal', value: 'eq'},
      {name: 'non equal', value: 'neq'}
    ];

    sc.types = [
      {name: 'threshold', value: 'threshold'},
      {name: 'radius', value: 'radius'}
    ];

    sc.getOperatorName = function (el) {
      if (!el.operator) {
        return null;
      }
      return sc.operators.filter(function (item) {
        return item.value === el.operator;
      })[0].name;
    };

    sc.add = function () {
      sc.triggers.push({});
      _.last(sc.triggers).edit = true;
    };

    sc.remove = function (el) {
      el.$remove(function () {
        sc.triggers = _.without(sc.triggers, el);
      });
    };

    sc.submit = function (el) {
      if (el._id) {
        trigger.save(el);
      } else {
        sc.triggers[sc.triggers.indexOf(el)] = trigger.create(
          {sensorId: sc.sensor},
          el
        );
      }
    };

  }]).

  controller('StreamCtrl', ['$scope', '$routeParams', 'data', 'socket', 'trigger',
    function (sc, params, data, socket, trigger) {
      sc.sensor = params.id;
      sc.data = [];
      sc.fired = [];
      sc.stream = true;

      sc.triggers = trigger.query({sensorId: sc.sensor});

      socket.connect('/stream');
      socket.emit('subscribe', params.id);

      socket.on('data', function (el) {
        if (sc.stream && el.id === sc.sensor) {
          sc.data = sc.data.concat(el.data);
        }
      });

      socket.on('fired', function (el) {
        if (sc.stream && el.id === sc.sensor) {
          sc.fired = sc.fired.concat(el.data);
        }
      });
    }]).

  controller('DataCtrl', ['$scope', 'data', 'fired', function (sc, data, fired) {
    sc.unit = 'minutes';
    sc.period = '1';

    sc.scales = [
      {name: '1 minute', sample: 'raw', unit: 'minutes', period: '1'},
      {name: '5 minutes', sample: 'raw', unit: 'minutes', period: '5'},
      {name: '30 minutes', sample: 'raw', unit: 'minutes', period: '30'},
      {name: '1 hour', sample: 'raw', unit: 'hours', period: '1'},
      {name: '6 hours', sample: 'averaged', unit: 'hours', period: '6'},
      {name: '1 day', sample: 'averaged', unit: 'days', period: '1'},
      {name: '7 days', sample: 'averaged', unit: 'days', period: '7'},
      {name: '1 month', sample: 'averaged', unit: 'months', period: '1'},
      {name: '3 months', sample: 'averaged', unit: 'months', period: '3'}
    ];

    sc.scale = sc.scales[0];

    sc.updateTime = function (start, end) {
      sc.start = start || sc.start || moment();
      sc.end = end || moment(sc.start).add(sc.unit, sc.period);
    };

    sc.updateData = function () {
      data.query({
        id: sc.sensor,
        start: sc.start.toISOString(),
        end: sc.end.toISOString()
      }, function (data) {
        sc.data = data;
      });
    };

    sc.updateFired = function () {
      fired.lapse({
        sensorId: sc.sensor,
        start: sc.start.toISOString(),
        end: sc.end.toISOString()
      }, function (fired) {
        sc.fired = fired;
      });
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
      sc.updateData();
      sc.updateFired();
    };

    sc.back = function () {
      sc.stream = false;

      sc.end.subtract(sc.unit, sc.period);
      sc.start.subtract(sc.unit, sc.period);
      sc.updateData();
      sc.updateFired();
    };

    sc.$watch('scale', function () {
      sc.unit = sc.scale.unit;
      sc.period = sc.scale.period;

      sc.updateTime();
      sc.updateData();
    });

  }]).

  controller('DashBoardCtrl', ['$scope', '$routeParams', 'sensor', 'device', 'home', 'socket', '_',
    function (sc, params, sensor, device, home, socket, _) {
      sc.data = {};
      sc.fired = {};
      sc.rooms = [];
      socket.connect('/dashboard');

      sc.sensors = sensor.query({'populate': true}, function () {
        socket.emit('subscribe', sc.sensors.map(function (el) {
          return el._id;
        }));
      });

      sc.homes = home.query();

      device.query({'populate': true}, function (devices) {
        sc.devices = _.filter(devices, function (device) {
          return _.find(device.sensors, function (el) {
            return el.name == 'General purpose';
          });
        });
      });

      socket.on('data', function (el) {
        _.find(sc.sensors, function (sensor) {
          return sensor._id === el.id;
        })._last = el.data;
      });

      socket.on('fired', function (el) {
        sc.fired[el.id] = el.data;
      });

      sc.submit = function () {
        sc.rooms.forEach(function (room, i) {
          room.actuator = "53c7d3d168275cf55d9aa780";
        });

        if (!sc.rooms.length > 0) { return false; }

        sc.home = home.save({
          name: "home " + Number(sc.homes.length + 1),
          rooms: sc.rooms
        }, function () {
          sc.homes.push(sc.home);
        });
      };

      sc.remove = function (home) {
        home.$remove({id: home._id}, function () {
          sc.homes = _.without(sc.homes, home);
        });
      }

      sc.dropped = function(dragEl, dropEl) {
    	  // this is your application logic, do whatever makes sense
    		var drag = angular.element(dragEl);
    		var drop = angular.element(dropEl);

    		if (drag.attr("x-lvl-drop-target") == "true"){
    			console.log("Building room");
          sc.rooms.push({
            name: 'Room ' + drop.attr('room'),
            roomId: drop.attr('room'),
            x: Number(drag.attr('col')),
            y: Number(drag.attr('row')),
            height: Number(drop.attr('row')) - Number(drag.attr('row')) + 1,
            width: Number(drop.attr('col')) - Number(drag.attr('col')) + 1,
            devices: []
          });

    		//drag.addClass("grey");
    		} else {
    			if (drop.attr('room') == null) {
    				console.log("Not a room");
    			} else {
    				//drop.removeClass("slot");
    				//drop.text(drag.text());
            _.find(sc.rooms, function (room) {
              return room.roomId == drop.attr('room');
            }).devices.push(drag.text());

            var device = _.find(sc.devices, function (el) {return el._id == drag.text()});
            sc.devices = _.without(sc.devices, device);

            drop.addClass("image");
            drop.attr('title', drag.text());
            drag.attr('draggable', false);
            drag.text("");
            drop.attr("x-lvl-drop-target", false)
            console.log("The element " + drag.attr('id') + " has been dropped on room " + drop.attr("room") + "!");
    			}
    		}
      };
    }]).

  controller('FloorPlanCtrl', ['$scope', '$routeParams', 'device', 'home', 'socket', '_',
    function (sc, params, device, home, socket, _) {
      sc.home_id = params.id;
      sc.data = {};
      sc.fired = {};
      sc.sensors = [];
      socket.connect('/dashboard');

      sc.devices = device.query({'populate': true}, function () {
        sc.devices.forEach(function (device) {
          device.sensors.forEach(function (sensor) {
            sensor.device = device._id;
            sc.sensors.push(sensor);
          });
        });

        socket.emit('subscribe', sc.sensors.map(function (el) {
          return el._id;
        }));
      });

      sc.floorplan = null;
      home.get({id: sc.home_id}, function (result) {
        sc.floorplan = result;
      });

      socket.on('data', function (el) {
        _.find(sc.sensors, function (sensor) {
          return sensor._id === el.id;
        })._last = el.data;
      });

      socket.on('fired', function (el) {
        sc.fired[el.id] = el.data;
      });
    }]);

