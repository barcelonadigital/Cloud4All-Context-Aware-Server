/**
 * Socket IO routes.
**/

'use strict';

var pubsub = require('../managers/pubsub-redis'),
  _ = require('underscore');

module.exports = function (app, io) {

  var psManager = new pubsub.PubSub({pub: app.pub, sub: app.sub});

  app.sub.on('message', function (channel, message) {

    var el = JSON.parse(message),
      last = _.last(el);

    io.of('/stream')['in'](channel).emit('data', el);
    io.of('/dashboard').emit('data', _.extend({'id': channel}, last));
  });

  io.of('/dashboard').on('connection', function (socket) {
    /*
     * Connect to all queried rooms.
    */

    var currentRooms = [];

    socket.on('subscribe', function (rooms) {

      currentRooms = rooms;
      rooms.forEach(function (room) {
        psManager.subscribe(room, socket);
      });
    });

    socket.on('disconnect', function () {
      currentRooms.forEach(function (room) {
        psManager.unsubscribe(room, socket);
      });
    });
  });

  io.of('/stream').on('connection', function (socket) {
    var currentRoom = null;

    socket.on('subscribe', function (room) {
      psManager.subscribe(room, socket);
      socket.join(room);
      currentRoom = room;
    });

    socket.on('disconnect', function () {
      psManager.unsubscribe(currentRoom, socket);
    });
  });
};
