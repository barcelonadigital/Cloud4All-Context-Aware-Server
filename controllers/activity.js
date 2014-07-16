/**
 * Commands API routes.
**/

'use strict';

var app = require('../app'),
  trigger = require('../triggers/sensor-trigger'),
  sensorClass = {'entityName': 'sensor'},
  Data = require('../models/devices').Data,
  Sensor = require('../models/devices').Sensor;

