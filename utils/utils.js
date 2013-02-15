/**
* General Utils methods 
**/


exports.UUIDCheck = function(uuid) {
	var re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
	return uuid.match(re);
}

