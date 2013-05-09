var app = require('../app')
  , Config = require('./configs').Config
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/**
 * Sensor Schema
 */

var UserSchema = new Schema({
  uuid: {type: String, unique: true},
  gps: {type: [Number], index: '2d'},
  profile: {type: Schema.Types.Mixed}
})

UserSchema.statics.findNear = function(params, cb) {
  var km = 111.12;

  params.gps = params.gps;
  params.maxDistance = params.maxDistance || 1;

  this
    .model('User')
    .find({gps: {
      $near: params.gps, 
      $maxDistance: params.maxDistance / km}}, 
      cb);
}

UserSchema.methods.getConfig = function (cb) {
  var that = this;
  Config.findByRef(that.id, cb);
}

UserSchema.statics.findByUuid = function (uuid, cb) {
  this.findOne({uuid: uuid}, cb);
}

UserSchema.pre('remove', function (next) {
  Config.remove({_ref: this.id}, next);
})

UserSchema.pre('save', function (done) {
  // create default user-config
  var that = this;
  Config.findByRef(that.id, function (err, config) {
    if (!config) {
      new Config({
        _ref: that.id,
        config: app.envConfig.triggers.user
      }).save(done);
    } else {
      done();
    }
  })
})

var User = mongoose.model('User', UserSchema);

module.exports = {
  User: User, 
};
