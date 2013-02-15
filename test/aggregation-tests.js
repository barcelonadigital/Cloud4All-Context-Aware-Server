var agg = require('../utils/aggregation')
	, should = require('should')
	, array_sample = [1,1,1,1,1]
	, string_sample = "1,1,1,1,1"
	, string_noisy_sample = "([1,1,1,1,1])";

describe('Aggregation SUM', function() {
	it('sums an array', function(done) {
		agg.aggregate(array_sample, agg.sum, function(res){
			res.should.equal(5);
			done();
		})
	})
	it('sums a string', function(done) {
		agg.aggregate(string_sample, agg.sum, function(res){
			res.should.equal(5);
			done();
		})
	})
	it('sums a noisy string', function(done) {
		agg.aggregate(string_noisy_sample, agg.sum, function(res){
			res.should.equal(5);
			done();
		})
	})
})

describe('Aggregation MEAN', function() {
	it('sums a noisy string', function(done) {
		agg.aggregate(array_sample, agg.mean, function(res){
			res.should.equal(1);
			done();
		})
	})
})
