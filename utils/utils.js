/**
* General Utils methods
**/

"use strict";


exports.UUIDCheck = function (uuid) {
  /*
  ** Checks if uuid is valid
  */
  var re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  uuid = (uuid || '').toString();
  return uuid.match(re);
};

exports.deepen = function (o) {
   /*
  ** Converts javascript dot notation object to nested object
  */
  var oo = {},
    t,
    parts,
    part,
    k;

  for (k in o) {
    if (o.hasOwnProperty(k)) {
      t = oo;
      parts = k.split('.');
      var key = parts.pop();
      while (parts.length) {
        part = parts.shift();
        t = t[part] = t[part] || {};
      }
      t[key] = o[k];
    }
  }
  return oo;
};

exports.compare = function (type, a, b) {
  switch(type) {
    case "gt":
      return a > b;
    case "gte":
      return a >= b;
    case "lte":
      return a <= b;
    case "lt":
      return a < b;
    default:
      return new Error("incorrect comparison type: " + type);
  }
};
