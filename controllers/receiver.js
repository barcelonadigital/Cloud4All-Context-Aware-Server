/**
 * Receiver API routes.
**/

"use strict";

var app = require('../app');

exports.post = function (req, res, next) {
  /**
   * Posts new sensor from CAS
  **/
  var item = req.body;
  res.send(item);
};