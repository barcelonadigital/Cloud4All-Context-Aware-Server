Cloud4All---Context-Aware-Server
================================

Description
-----------

The Context Aware Server (CAS) developed in NodeJs provides a platform that collects and process the data from sensors and when some triggers are fired it sends the processed data to gpii-flowmanager

License
-------

This project has been developed by Barcelona Deigital Health department. Device reporter is shared under New BSD license. This project folder includes a license file. You can share and distribute this project and built software using New BSD license. Please, send any feedback to http://www.cloud4all.info


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

	node app.js

Then you can then send a POST request to the CAS to add a new sensor. For example, you can send the sample in test/data folder

	curl -H "Content-Type: application/json" -X POST --data @test/data/sensor-sample.json http://localhost:8888/sensors

Afterwards you can send a POST request to the CAS to add data to the new sensor.

	curl -H "Content-Type: application/json" -X POST --data @test/data/sensor-sample-data.json http://localhost:8888/sensors/1/data

And get all the data stored in CAS from that sensor

	curl http://localhost:8888/sensors/1/data


Running Tests
-------------

Test are implemented using mocha. To run the test suite first invoke the following command within the repo, installing the development dependencies:

	npm install
	make test


Contributors
------------

	Guillem Serra from Barcelona Digital
	
