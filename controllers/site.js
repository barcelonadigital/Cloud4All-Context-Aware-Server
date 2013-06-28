/**
 * Site routes
 */

"use strict";

exports.index = function (req, res) {
  res.render('index', { title: 'Express' });
};
