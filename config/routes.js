// here we load de routes 
var sensor = require('../routes/sensor')
  , config = require('../routes/config')
  , user = require('../routes/user')
  , site = require('../routes/site');


module.exports = function(app) {
  // General
  app.get('/', site.index);

  // Api:sensors
  app.get('/sensors/:id', sensor.get);
  app.get('/sensors', sensor.search);
  app.get('/sensors/:id/data', sensor.getData);
  app.post('/sensors', sensor.post);
  app.post('/sensors/:id', sensor.update);
  app.post('/sensors/:id/data', sensor.postData);

  // Api:config
  app.get('/configs/:id', config.get);
  app.get('/configs/:id/:key', config.getValue);
  app.post('/configs', config.post);
  app.post('/configs/:id', config.update);
  app.post('/configs/:id/:key', config.updateValue);

  // Api:sensors
  app.get('/users/:id', user.get);
  app.get('/users', user.search);
  app.post('/users', user.post);
  app.post('/users/:id', user.update);

}
