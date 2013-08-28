// here we load de routes 
var sensor = require('../controllers/sensor'),
  config = require('../controllers/config'),
  user = require('../controllers/user'),
  site = require('../controllers/site'),
  device = require('../controllers/device');

module.exports = function (app) {
  // General
  app.get('/', site.index);
  app.get('/partials/:name', site.partials);

  // Api:devices
  app.get('/devices/:id', device.get);
  app.post('/devices', device.post);
  app.post('/devices/:id', device.update);
  app.del('/devices/:id', device.remove);

  // Api: sensors
  app.get('/sensors/:id', sensor.get);
  app.get('/sensors/', sensor.search);

  // Api:sensor-data
  app.get('/sensors/:id/data', sensor.getData);
  app.post('/sensors/:id/data', sensor.postData);

  // Api:config
  app.get('/configs/:id', config.get);
  app.post('/configs', config.post);
  app.post('/configs/:id', config.update);
  app.del('/configs/:id', config.remove);

  // Api:users
  app.get('/users/:id', user.get);
  app.get('/users', user.search);
  app.post('/users', user.post);
  app.post('/users/:id', user.update);
  app.del('/users/:id', user.remove);
};
