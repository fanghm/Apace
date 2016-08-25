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

exports.Action = mongoose.model('Action');