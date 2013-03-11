/**
* General Utils methods 
**/


exports.UUIDCheck = function(uuid) {
  /*
  ** Checks if uuid is valid
  */
  var uuid = (uuid || '').toString();
  var re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuid.match(re);
}

exports.deepen = function(o) {
   /*
  ** Converts javascript dot notation object to nested object
  */
  var oo = {}, t, parts, part;
  for (var k in o) {
    t = oo;
    parts = k.split('.');
    var key = parts.pop();
    while (parts.length) {
      part = parts.shift();
      t = t[part] = t[part] || {};
    }
    t[key] = o[k]
  }
  return oo;
}