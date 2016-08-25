var Action       = require('../models').Action;
var config       = require('../config');
var EventProxy   = require('eventproxy');

var getActionsByQuery = function (query, opt, callback) {
  query.deleted = false;
  Action.find(query, {}, opt, function (err, actions) {
    if (err) {
      return callback(err);
    }

    if (actions.length === 0) {
      return callback(null, []);
    }

    //actions = _.compact(actions);
    return callback(null, actions);
  });
};


exports.index = function(req, res, next) {

  getActionsByQuery({}, {}, function (err, actions) {
    if (err) {
      return next(err);
    }

    res.render('action', {actions: actions});
  });

};








