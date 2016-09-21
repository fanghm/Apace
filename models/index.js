var mongoose = require('mongoose');
var config   = require('../config');
var logger = require('../common/logger');

mongoose.connect(config.db, {
  server: {poolSize: 20}
}, function (err) {
  if (err) {
    logger.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

// models
require('./action');
require('./user');
require('./setting');

exports.Action  = mongoose.model('Action');
exports.User    = mongoose.model('User');
exports.Setting = mongoose.model('Setting');