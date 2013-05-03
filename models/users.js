var app = require('../app')
  , Config = require('./configs').Config
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/**
 * Sensor Schema
 */

var UserSchema = new Schema({
  uuid: {type: String, unique: true},
  gps: [Number],
  profile: {type: Schema.Types.Mixed}
})

UserSchema.methods.getConfig = function (cb) {
  var that = this;
  Config.findByRef(that.id, function (err, item) {
  });
}

UserSchema.statics.findByUuid = function (uuid, cb) {
  this.findOne({uuid: uuid}, cb);
}

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
