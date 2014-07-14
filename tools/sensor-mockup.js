
'use strict';

var util = require('util'),
  optimist = require('optimist'),
  moment = require('moment'),
  http = require('http');


(function () {

  var args = optimist.argv,
    id = args.id || null,
    num = args.num || 1,
    type = args.type || 'int',
    sleep = args.sleep || 1000,
    host = args.host || 'localhost',
    port = args.port || '8888';

  if (!id) {
    console.error('No id provided, please provide sensor id');
    return false;
  }

  var getRandomData = function (type) {
    switch (type) {
    case 'int':
      return Math.floor((Math.random() * 10) + 1);
    case 'bool':
      return Math.random() > 0.5 ? true : false;
    }

  };

  var path = '/sensors/' + id + '/data';
  var sendData = function () {

    var data = [],
      now = moment(),
      i = 0;

    for (i = 0; i < num; i++) {
      data[i] = {
        at: now.add(sleep * i / (2 * num)).toISOString(),
        value: getRandomData(type)
      };
    }

    data = JSON.stringify(data);

    var options = {
      host: host,
      port: port,
      path: path,
      method: 'POST',
      agent: false,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log('sending random data: ' +
      data + ' to: ' + options.host + ':' +
      options.port + options.path);

    var req = http.request(options, function (res) {
      res.setEncoding('utf8');
      console.log('successfully sent random data: ' +
        data + ' to: ' + options.host + ':' +
        options.port + options.path);
    });

    req.on('error', function (e) {
      console.log('Got error: ' + e.message);
    });

    req.write(data);
    req.end();
  };

  setInterval(sendData, sleep);

}());
