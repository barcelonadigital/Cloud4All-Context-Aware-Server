/**
 * Socket IO routes.
**/

'use strict';

var pubsub = require('../managers/pubsub-redis'),
  User = require('../models/users').User,
  _ = require('underscore');

module.exports = function (app, io, next) {

  var psManager = new pubsub.PubSub({pub: app.pub, sub: app.sub});

  app.sub.on('message', function (channel, message) {

    var root = channel.split('.')[0],
      id = channel.split('.')[1],
      el = JSON.parse(message);

    switch (root) {
    case 'data':
      io.of('/stream')['in'](id).emit('data', {'id': id, 'data': el});
      io.of('/dashboard').emit('data', {'id': id, 'data': _.last(el)});
      break;

    case 'fired':
      io.of('/stream')['in'](id).emit('fired', {'id': id, 'data': el});
      io.of('/dashboard').emit('fired', {'id': id, 'data': el});
      break;

    case 'near':
      io.of('/context-stream')['in'](id).emit('fired', {'id': id, 'data': el});
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
        psManager.subscribe('data.' + room, 'fired.' + room, socket);
      });
    });

    socket.on('disconnect', function () {
      currentRooms.forEach(function (room) {
        psManager.unsubscribe('data.' + room, 'fired.' + room, socket);
      });
    });
  });

  io.of('/context-stream').on('connection', function (socket) {
    /*
     * client connects to the context and receive information
     * if there is relevant context near their location. Steps:
     *  1. we create a user into database with the gps location from parameters
     *  2. the user.uuid is passed to the client
     *  3. the client connects to his specific room.uuid
     *  4. when new trigger is fired with users in nearby. data is pushed to room.uuid
    */

    var currentRoom = null;
    var user = null;

    socket.on('location', function (location) {
      user = new User({'gps': location});
      user.save(function (err, user) {
        if (err) {
          next(err);
        } else if (user)  {
          socket.emit('new-user', user.id);
        }
      });
    });

    socket.on('subscribe', function (room) {
      psManager.subscribe('near.' + room, socket);
      socket.join(room);
      currentRoom = room;
    });

    socket.on('disconnect', function () {
      psManager.unsubscribe('near.' + currentRoom, socket);
      if (user) { user.remove(); }
    });
  });

  io.of('/stream').on('connection', function (socket) {
    /*
     * Connect to a specific room.
     */

    var currentRoom = null;

    socket.on('subscribe', function (room) {
      psManager.subscribe('data.' + room, 'fired.' + room, socket);
      socket.join(room);
      currentRoom = room;
    });

    socket.on('disconnect', function () {
      psManager.unsubscribe('data.' + currentRoom, 'fired.' + currentRoom, socket);
    });
  });
};
