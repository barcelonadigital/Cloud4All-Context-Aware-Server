/**
 * Commands API routes.
**/

'use strict';

var app = require('../app'),
  trigger = require('../triggers/sensor-trigger'),
  sensorClass = {'entityName': 'sensor'},
  Data = require('../models/devices').Data,
  Device = require('../models/devices').Device,
  Room = require('../models/homes').Room,
  Home = require('../models/homes').Home,
  Sensor = require('../models/devices').Sensor,
  Client = require('node-rest-client').Client;;


exports.get = function (req, res, next) {
	var name = req.params.name;
	switch(name)
	{
		//Turn on lights of the current room
		case "light":
			console.log(name)

			//Get list movement sensors
			var sensors = Sensor.find({'name' : 'General purpose'}).exec(
					function (err, sensors) {
						console.log("sensors selected:" + sensors.length);

						//prepare condition
						var strSensors = [];
						for (var i = 0; i < sensors.length; i++)
							strSensors.push(sensors[i].id)

						var search = {
				    	'_sensor': {$in: strSensors},
				    	'value' : {$gt: 0}
				    	}
						console.log("search condition: " + JSON.stringify(search));

						//Get last active value from sensors
						Data.getLastActiveSensor(search, function (err, activeSensor) {

							console.log("Last active sensor id: " + activeSensor._sensor);

							//Get device from sensor
							Device.findOne({"sensors": activeSensor._sensor}, function(err, device){
								console.log("device id: " + device.id);

								//Get room of the device
								Home.find(function (err, homes) {
								  if (err) return console.error(err);

								  for (var h = 0; h < homes.length; h++){
								  	for(var r = 0; r < homes[h].rooms.length; r++)
								  		if (homes[h].rooms[r].devices.indexOf(device.id) > -1)
								  		{
								  			//Print room
								  			var detectedRoom = homes[h].rooms[r];
								  			console.log("Event detected at room:" + JSON.stringify(detectedRoom));
								  			console.log("Actuator to use: " + detectedRoom)

			  								//Turn on light from selected sensors
			  								//curl -X POST -H "Content-Type: application/json" --data '{"command":"on"}' http://localhost:8080/devices/53c65378f7d51f7831b3e9d4/commands
			  								var client = new Client();

			    							// set content-type header and data as json in args parameter
			    							var args = {
			    							  data: {"command":"on" },
			    							  headers:{"Content-Type": "application/json"}
			  							  };

			    							var url = "http://localhost:8080/devices/" + detectedRoom.actuator + "/commands";
			    							console.log("URL:", url);
			    							client.post(url, args, function(data,response, error) {
			        					      // parsed response body as js object
			        					    console.log(data);
			        					    // raw response
			        					    console.log(response);
			        					    next(error);
			        					});
								  		}
								  }
								  next();
								});
							});
					  });
					});


			break;
		default:
			console.log("ERROR. Command invalid")
			break
	}
	res.send(200);
}
