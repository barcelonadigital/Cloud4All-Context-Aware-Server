Cloud4All---Context-Aware-Server
================================

Description
-----------

The Context Aware Server (CAS) developed in NodeJs provides a platform that collects, stores and process the data from sensors and when some triggers are fired it sends the processed data to a client in json format.


License
-------

This project has been developed by Barcelona Digital Health department. Device reporter is shared under New BSD license. This project folder includes a license file. You can share and distribute this project and built software using New BSD license. Please, send any feedback to http://www.cloud4all.info


Installation
------------

Download de zip file and uncompress it.

	cd Cloud4All---Context-Aware-Server-master
	npm install

It will install all needed packages that can be found in package.json file. Aftwards, you need to install Redis database. In ubuntu/debian

	$ apt-get install redis-server


Quick Start & Examples
----------------------

The best way to get started with the CAS is running it using node

```bash
node app.js
```

Then you can then send a POST request to the CAS to add a new sensor. For example, you can send the sample in test/data folder

```bash
curl -H "Content-Type: application/json" -X POST --data @test/data/sensor-sample-uuid.json http://localhost:8888/sensors
```
Afterwards you can send a POST request to the CAS to add data to the new sensor.

```bash
curl -H "Content-Type: application/json" -X POST --data @test/data/sensor-sample-data.json http://localhost:8888/sensors/1/data
```
And get all the data stored in CAS from that sensor

```bash
curl http://localhost:8888/sensors/1/data
```

Setup
-----

CAS can be configured using a Restful API. To setup a new base configuration, send a POST request to /configs/

```json
{		
	"id": "base",
	"triggers.onNewData.data": "all",
	"triggers.onNewData.aggregation": "max",
	"triggers.onNewData.trigger": "threshold",
	"triggers.onNewData.threshold": "3",
	"triggers.onNewData.diffRadius": "10",
	"triggers.onNewData.triggered": "send",
	"triggers.onNewData.send": "store",
	"triggers.onNewData.store": "ack",
	"triggers.scheduling.data": "mean",
	"triggers.scheduling.time": "60",
	"triggers.onNewUser.data": "all",
	"triggers.onNewUser.aggregation": "mean",
	"triggers.onNewUser.trigger": "threshold",
	"triggers.onNewUser.threshold": "15",
	"receiver.host": "localhost",
	"receiver.port": "8889",
	"receiver.path": "/receiver"
}
```

You can also setup a new device configuration sending a POST request to /configs/ and replacing id key to an **existing** sensor:id id.

```json
{		
	"id": "sensor:1",
	"triggers.onNewData.data" : "all",
	"triggers.onNewData.aggregation": "sum",
	"triggers.onNewData.trigger": "threshold",
	"triggers.onNewData.threshold": "15",
	"triggers.onNewData.diffRadius": "10",
	"triggers.onNewData.triggered": "send",
	"triggers.onNewData.send": "store",
	"triggers.onNewData.store": "ack",
	"triggers.scheduling.data": "mean",
	"triggers.scheduling.time": "60",
	"receiver.host": "localhost",
	"receiver.port": "8889",
	"receiver.path": "/receiver"
} 
```

Updating the configuration is possible sending a POST request to /configs/:id where id can be "base" or "sensor:1" respectivelly.

Finally, you can also update and get specific values from a specific config system. Use GET to retrieve the value from key config parameter from id configuration:

	GET /configs/:id/:key

You will retrieve a json data with {key:value} format. You can also update a specific value using POST:

	POST /configs/:id/
	body = {
		"triggers.onNewData.data" : "raw"
	}

Triggering System
-----------------

When new data arrives to the Context awareness server, it fires a "onNewData" event. Afterwards, a listener gets the sensor configuration or the base configuration if absent from the redis database.Then the trigger system will emit specific events depending on the configuration. These events will collect, process the data and send the data to the receiver if the trigger (for example the threshold) is surpassed. 

For example, using the sensor:1 configuration above, when new data arrives, the trigger system will collect "all" the sensor data stored, will "sum" it and then uses a simple threshold method to know if this sum is above the required value "15", if it is such the case, it will send the data to the "localhost" receiver.

### Aggregation Methods

	sum = sum of all values
	mean = mean of all values
	max = max of all values
	min = min of all values
	last = last of new values

### Data Query methods

	all = all stored data
	new = only new data

### Trigger methods
	
1. threshold = triggered when the value is above a threshold. threshold value must be defined. `"threshold": "{number}"`
2. diffRadius = triggered when there is a the last new value `y` and the last sent value `x` do comply the inequattion `|y - x| > {number} / 100 * x` where `{number}` is the defined value in configuration `"diffRadius": "{number}"`. Default 10%.


Running Tests
-------------

Test are implemented using mocha. To run the test suite first invoke the following command within the repo, installing the development dependencies:

	npm install
	make test


Contributors
------------

	Guillem Serra from Barcelona Digital
	
