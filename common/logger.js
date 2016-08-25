var config = require('../config');

var env = process.env.NODE_ENV || "development";

var log4js = require('log4js');
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/apace.log', category: 'apace' }
  ]
});

var logger = log4js.getLogger('apace');
logger.setLevel(config.debug && env !== 'test' ? 'DEBUG' : 'ERROR')

module.exports = logger;
