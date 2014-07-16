/**
 * Commands API routes.
**/

'use strict';

var app = require('../app'),
  trigger = require('../triggers/sensor-trigger'),
  sensorClass = {'entityName': 'sensor'},
  Data = require('../models/devices').Data,
  Sensor = require('../models/devices').Sensor;

exports.get = function (req, res, next) {
	var name = req.params.name;
	switch(name)
	{
		//Turn on lights of the current room
		case "light":
			console.log(name)
	
			//Get current room
			
			//Get sensors from current room
			
			//Turn on light from selected sensors	
			
			break;
		default:
			console.log("ERROR. Command invalid")
			break
	}
	res.send(200);
}