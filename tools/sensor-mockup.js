
'use strict';

var util = require('util'),
  optimist = require('optimist'),
  http = require('http');


(function () {

  var args = optimist.argv,
    id = args.id || null,
    sleep = args.sleep || 1000,
    host = args.host || 'localhost',
    port = args.port || '8888';

  if (!id) {
    console.error('No id provided, please provide sensor id');
    return false;
  }

  var path = '/sensors/' + id + '/data';
  var sendData = function () {

    var data = [{
        at: (new Date()).toISOString(),
        value: Math.floor((Math.random() * 10) + 1)
      }];

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