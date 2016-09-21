var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session'); // no dependency on cookie-parser
var MongoDBStore = require('connect-mongodb-session')(session);
var config = require('./config');
var routes = require('./routes/index');
var app = express();
require('colors');  // for colorful console output

// middlewares
var renderMiddleware = require('./middlewares/render');
require('./middlewares/db_trace');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');  // handlebars template engine

if (config.debug) {
  app.use(renderMiddleware.render); // logging render time
}

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
//console.log(path.join(__dirname, 'public', 'images', 'favicon.ico'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser(config.session_secret));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

var store = new MongoDBStore(
  {
    uri: 'mongodb://127.0.0.1:27017/apace_sessions',
    collection: 'apace'
  }/*,
  function(error) {
    if (error) console.log("Fail to connect to mongodb: " + JSON.stringify(error) );
  }*/);

// store.on('error', function(error) {
//   console.log("Fail to store user session: " + error.message);
// });

var sess = {
  store: store,
  secret: config.session_secret,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    //signed: true,
  },
  resave: true, // false,
  saveUninitialized: true, // false,
  secure: false,
  sameSite: false,
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  //sess.cookie.secure = true; // serve secure cookies
}

app.use(session(sess));
// app.use(function(req, res, next) {
//   res.locals.session = req.session;
//   next();
// });

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// get host ip
var os = require('os');
var ifaces = os.networkInterfaces();
Object.keys(ifaces).some(function (ifname) {
  var found = false;

  ifaces[ifname].some(function (iface) {
    if ('IPv4' === iface.family && iface.internal === false) {
      config['apace_url'] = 'http://' + iface.address;
      return found = true;
    }
  });

  if (found) return true;
});

var port = (config.port || '3000');
if ('80' !== port) {
  config['app_url'] += ':' + (config.port || '3000');
}
// console.log(config['app_url']);

module.exports = app;
