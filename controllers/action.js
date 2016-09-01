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

    // convert obj array to map for the convenience of fetching data with _id in client js
    var obj = {};
    actions.forEach(function ( action ) {
      obj[ action._id ] = action;
    });

    var data = {
      actions: actions,
      json: JSON.stringify(obj) // for client js access only
    };

    res.render('action', data);
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
      console.log("Error in saving: " + err.message + '\n action:' + JSON.stringify(act));
      return res.status(200).json({error: err.message});
    } else {
      return res.status(200).json(action);
    }

  });
};






