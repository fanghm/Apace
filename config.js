var config = {
  debug: true,  // true for local testing

  // mongodb config
  db: 'mongodb://127.0.0.1/apace_dev',

};

if (process.env.NODE_ENV === 'test') {
  config.db = 'mongodb://127.0.0.1/apace_test';
}

module.exports = config;