var mongoose  = require('mongoose');
var config    = require('../config');
var logger    = require('../common/logger');

mongoose.Promise = global.Promise;  // to suppress DeprecationWarning
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
require('./category');

exports.Action    = mongoose.model('Action');
exports.User      = mongoose.model('User');
exports.Setting   = mongoose.model('Setting');
exports.Category  = mongoose.model('Category');