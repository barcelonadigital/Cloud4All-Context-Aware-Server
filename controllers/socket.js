/**
 * Socket IO routes.
**/

'use strict';

var pubsub = require('../managers/pubsub-redis'),
  _ = require('underscore');

module.exports = function (app, io) {

  var psManager = new pubsub.PubSub({pub: app.pub, sub: app.sub});

  app.sub.on('message', function (channel, message) {

    var root = channel.split('.')[0],
      id = channel.split('.')[1],
      el = JSON.parse(message);

    switch (root) {
    case 'data':
      io.of('/stream')['in'](id).emit('data', el);
      io.of('/dashboard').emit('data', {'id': id, 'data': _.last(el)});
      break;

    case 'trigger':
      io.of('/stream')['in'](id).emit('trigger', el);
      io.of('/dashboard').emit('trigger', {'id': id, 'data': el});
      break;
    }
  });

  io.of('/dashboard').on('connection', function (socket) {
    /*
     * Connect to all queried rooms.
     */

    var currentRooms = [];

    socket.on('subscribe', function (rooms) {

      currentRooms = rooms;
      rooms.forEach(function (room) {
        psManager.subscribe('data.' + room, 'trigger.' + room, socket);
      });
    });

    socket.on('disconnect', function () {
      currentRooms.forEach(function (room) {
        psManager.unsubscribe('data.' + room, 'trigger.' + room, socket);
      });
    });
  });

  io.of('/stream').on('connection', function (socket) {
    /*
     * Connect to a specific room.
     */

    var currentRoom = null;

    socket.on('subscribe', function (room) {
      psManager.subscribe('data.' + room, 'trigger.' + room, socket);
      socket.join(room);
      currentRoom = room;
    });

    socket.on('disconnect', function () {
      psManager.unsubscribe('data.' + currentRoom, 'trigger.' + currentRoom, socket);
    });
  });
};
