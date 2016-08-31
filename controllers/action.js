var Action       = require('../models').Action;
var config       = require('../config');
var EventProxy   = require('eventproxy');
var validator    = require('validator');

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

exports.add = function(req, res, next) {

  //console.log('req.body: ' + JSON.stringify(req.body));
  // because there're too many attributes,
  // get them from req.body in a loop
  var act = new Action();
  for(var prop in req.body) {
    if (Object.getPrototypeOf(act).hasOwnProperty(prop)) {
      if (typeof req.body[prop] === 'string') {
        act[prop] = validator.trim(req.body[prop]);
      } else {
        act[prop] = req.body[prop];
      }
    }
  }

  // act.creator = req.session.user._id;
  //console.log("act: " + JSON.stringify(act));
  act.save(function (err, action, numAffected) {
    if (err) {
      console.log("Error in saving: " + err.message);
      return res.status(200).json({error: err.message});
    } else {
      return res.status(200).json(action);
    }

  });
};






