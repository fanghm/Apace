var Action       = require('../models').Action;
var User         = require('../models').User;
var Setting      = require('../models').Setting;
var config       = require('../config');
var mailer       = require('../middlewares/mail');
var EventProxy   = require('eventproxy');
var validator    = require('validator');
var _            = require('lodash');

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

var getAllNames = function (callback) {
  User.find({}, {name:1, _id:0}, {}, function (err, names) {
    if (err) {
      return callback(err);
    }

    if (names.length === 0) {
      return callback(null, []);
    }

    return callback(null, names);
  });
};

exports.index = function(req, res, next) {
  var ep = EventProxy.create();
  ep.fail(next);

  getActionsByQuery({}, {}, function (err, actions) {
    if (err) {
      return next(err);
    }
    ep.emit('actions', actions);
  });

  getAllNames(function (err, names) {
    if (err) {
      return next(err);
    }
    ep.emit('names', names);
  });

  ep.all('actions', 'names', function (actions, names) {
    // convert obj array to map for the convenience of fetching data with _id in client js
    var action_map = {};
    actions.forEach(function ( action ) {
      action_map[ action._id ] = action;
    });

    var name_list = _.map(names, 'name');
    console.log("name_list: " + JSON.stringify(name_list));

    var data = {
      actions: actions,
      action_map: JSON.stringify(action_map),
      name_list: JSON.stringify(name_list),
      action_categories: config.action_categories,
      action_status: config.action_status,
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

  act.create_at = act.update_at = Date.now();
  act.history.push({
    info: 'first created',
    by:   act.author,
    at:   act.create_at
  });

  console.log("add act: " + JSON.stringify(act));
  act.save(function (err, action, numAffected) {
    if (err) {
      console.log("Error in saving: " + err.message + '\n action:' + JSON.stringify(act));
      return res.status(200).json({error: err.message});
    } else {
      mailer.sendMail(config.test_email, function(err, info) {  // TODO: use owner's email
        if (err) {
          console.log("Error in sending email: " + err.message);
        } else {
          console.log("An email is sent to action owner: " + JSON.stringify(info));
        }
      });
      return res.status(200).json(action);
    }

  });
};

exports.delete = function(req, res, next) {
  var action_id = req.params.id;
  console.log("delete id:" + action_id);

  // Update deleted as true
  Action.findOne({_id: action_id, deleted: false}, function (err, action) {
    if (err) {
      return res.status(200).json({ msg: err.message });
    }

    if (!action) {
      return res.status(200).json({ msg: 'Action not found: _id = ' + action_id });
    }

    action.deleted = true;
    action.update_at = Date.now();
    action.save();
    //console.log("Deleted action: " + JSON.stringify(action));

    return res.status(200).json({msg: ''});
  });
};

exports.update = function(req, res, next) {
  var action_id = req.params.id;
  console.log("update id:" + action_id);

  // Update deleted as true
  Action.findOne({_id: action_id, deleted: false}, function (err, action) {
    if (err) {
      return res.status(200).json({ msg: err.message });
    }

    if (!action) {
      return res.status(200).json({ msg: 'Action not found: _id = ' + action_id });
    }

    // update
    for(var prop in req.body) {
      if (Object.getPrototypeOf(action).hasOwnProperty(prop)) {
        if (prop === 'history') { // append to array
          action[prop] = action[prop].concat(req.body[prop]);
        } else if (typeof req.body[prop] === 'string') {
          action[prop] = validator.trim(req.body[prop]);
        } else {
          action[prop] = req.body[prop];
        }
      }
    }

    action.update_at = Date.now();
    action.save(function (err, action, numAffected) {
      if (err) {
        console.log("Error in saving: " + err.message + '\n action:' + JSON.stringify(action));
        return res.status(200).json({error: err.message});
      } else {
        return res.status(200).json(action);
      }
    });

  });
}

// handle shortcut routes with in-built filters, for quick access
exports.route = function(req, res, next) {
  var url = validator.trim(req.url).toLowerCase();
  switch(url) {
    case 'cif':
    break;

    case 'rca':
    break;

    case 'ft1':
    break;

  default:
    break;
  }

  return res.status(200).json({url: url});
}