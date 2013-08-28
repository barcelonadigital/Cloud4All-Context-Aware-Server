/**
 * Socket IO routes.
**/

'use strict';

var pubsub = require('../managers/pubsub-redis');

module.exports = function (app, io) {

  var psManager = new pubsub.PubSub({pub: app.pub, sub: app.sub});

  app.sub.on('message', function (channel, message) {
    io.sockets.in(channel).emit('data', JSON.parse(message));
  });

  io.sockets.on('connection', function (socket) {
    var currentRoom = null;

    socket.on('subscribe', function (room) {
      psManager.subscribe(room, socket);
      socket.join(room);
      currentRoom = room;
    });

    socket.on('disconnect', function () {
      psManager.unsubscribe(currentRoom);
    });
  });
};
