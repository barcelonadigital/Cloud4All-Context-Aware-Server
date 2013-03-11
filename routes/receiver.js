/**
 * Receiver API routes.

 receiver = {
  'id': 1,
  'data': ["1,2,3,4,5,6"]
 }
**/

var app = require('../app');

exports.post = function(req, res, next) {
  /**
   * Posts new sensor from CAS
  **/
  var item = req.body;
  console.log("receiver post() id, data: " + item.id + ", " + item.data);
}