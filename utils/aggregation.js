

exports.sum = function(value, next) {
	var res = value.reduce(function(prev, cur){return prev + cur;});
	next(res);
}	

exports.mean = function(value, next) {
	exports.sum(value, function(res){
		next(res / value.length);
	})
}

exports.aggregate = function(value, operator, next) {
	if (value instanceof Array) {
		operator(value.map(parseFloat), next);
	} else if (typeof value == "string") {
		operator(value.replace(/[^0-9.,]+/g,"").split(",")
									.map(parseFloat), next);
	}
}
