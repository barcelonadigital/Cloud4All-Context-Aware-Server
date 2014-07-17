// here we load de routes
var sensor = require('../controllers/sensor'),
  config = require('../controllers/config'),
  user = require('../controllers/user'),
  site = require('../controllers/site'),
  trigger = require('../controllers/trigger'),
  triggerHistory = require('../controllers/trigger-history'),
  device = require('../controllers/device'),
  command = require('../controllers/command'),
  home = require('../controllers/home');

module.exports = function (app) {
  // General

  app.get('/', site.index);
  app.get('/partials/:name', site.partials);
  app.get('/templates/:name', site.templates);

  // Api:devices
  app.get('/devices/:id', device.get);
  app.get('/devices', device.search);
  app.post('/devices', device.post);
  app.post('/devices/:id', device.update);
  app.del('/devices/:id', device.remove);

  // Api: sensors
  app.get('/sensors/:id', sensor.get);
  app.get('/sensors', sensor.search);

  // Api:sensor-data,
  app.get('/sensors/:id/data', sensor.searchData);
  app.post('/sensors/:id/data', sensor.postData);

  // Api:triggers
  app.get('/triggers/:id', trigger.get);
  app.get('/triggers/', trigger.search);
  app.post('/triggers/:id', trigger.update);
  app.del('/triggers/:id', trigger.remove);

  app.get('/sensors/:id/triggers', trigger.searchBySensor);
  app.post('/sensors/:id/triggers', trigger.postBySensor);

  // Api:trigger-history
  app.get('/fired-triggers/:id', triggerHistory.get);
  app.get('/fired-triggers', triggerHistory.search);
  app.get('/sensors/:id/fired-triggers/date/:start/:end',
          triggerHistory.getTimeBySensor);

  // Api:config
  app.get('/configs/:id', config.get);
  app.get('/configs', config.search);
  app.post('/configs', config.post);
  app.post('/configs/:id', config.update);
  app.del('/configs/:id', config.remove);

  app.get('/sensors/:id/config', config.searchBySensor);

  // Api:users
  app.get('/users/:id', user.get);
  app.get('/users', user.search);
  app.post('/users', user.post);
  app.post('/users/:id', user.update);
  app.del('/users/:id', user.remove);

  //Api:commands
  app.get('/commands/:name/:value', command.get);

  //Api:home
  app.get('/homes/:id', home.get);
  app.get('/homes', home.search);
  app.post('/homes', home.post);
  app.del('/homes/:id', home.remove);

  // Redirect all others to the index (HTML5 History)
  app.get('*', site.index);

};
