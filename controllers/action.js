var Action       = require('../models').Action;
var User         = require('../models').User;
var UserCtrl     = require('./user');
var Setting      = require('../models').Setting;
var config       = require('../config');
var mailer       = require('../middlewares/mail');
var EventProxy   = require('eventproxy');
var validator    = require('validator');
var _            = require('lodash');

var getActionsByQuery = function (query, opt, callback) {
  Action.find(query, {}, opt, function (err, actions) {
    if (err) {
      return callback(err);
    }

    if (actions.length === 0) {
      return callback(null, []);
    }

    return callback(null, actions);
  });
};

// Fill missing user info
var updateUserInfo = function (owner, callback) {
  if (!owner.hasOwnProperty('email') && owner.hasOwnProperty('uid')) {
    UserCtrl.getUserMailById(owner.uid, function (err, user) {
      if (err) {
        callback(err);
      }

      if (user) {
        owner.email = user.mail;
        callback(null, owner);
      } else {
        callback(new Error('No such user with uidNumber - ' + owner.uid));
      }
    });
  } else if ( !owner.hasOwnProperty('uid') || !owner.hasOwnProperty('name') ) {
    UserCtrl.getUserByMail(owner.email, function (err, user) {
      if (err) {
        callback(err);
      }

      if (user) {
        owner.uid = user.uidNumber;
        owner.name = user.name;
        callback(null, owner);
      } else {
        // wrong email
        callback(new Error('No such user with email - ' + owner.email));
      }
    });
  } else {
    console.log('Fatal: unknown action owner: ' + JSON.stringify(owner));
    callback(new Error('Fatal: unknown action owner: ' + JSON.stringify(owner)));
  }
}

exports.index = function(req, res, next) {
  var ep = EventProxy.create();
  ep.fail(next);

  var query = { deleted: false };
  var options = { sort: 'create_at' };
  getActionsByQuery(query, options, ep.done('actions', function (actions) {
    return actions;
  }));

  UserCtrl.getUsers(ep.done('users', function (users) {
    return users;
  }));

  ep.all('actions', 'users', function (actions, users) {
    // convert users into array of objects {uidNumber: name} for name lookup
    // var user_map = _.reduce(users , function(obj, user) {
    //   obj[user.data] = user.value;
    //   return obj;
    // }, {});
    // console.log("user_map: " + JSON.stringify(user_map));

    // convert obj array to map for the convenience of fetching data with _id in client js
    var action_map = {};
    actions.forEach(function ( action ) {
      action_map[ action._id ] = action;
      console.log("action_map: " + JSON.stringify(action_map));
    });

    var data = {
      actions: actions,
      action_map: JSON.stringify(action_map),
      name_suggestions: JSON.stringify(users),
      action_categories: config.action_categories,
      action_status: config.action_status,
    };

    res.render('action', data);
  });

};

exports.add = function(req, res, next) {
  console.log('req.body: ' + JSON.stringify(req.body));

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
  
  var proxy = new EventProxy();
  proxy.fail(next);

  updateUserInfo(req.body.owner, function(err, owner) {
    if (err) {
      return res.status(500).json(err);
    }

    act.owner = owner;
    proxy.emit('email');
  });
  
  act.create_at = act.update_at = Date.now();
  act.history.push({
    info: 'first created',
    by:   req.body.author || 'NA',
    at:   act.create_at,
    status: act.status
  });

  console.log("add act: " + JSON.stringify(act));
  proxy.all('email', function (mail) {
    act.save(function (err, action, numAffected) {
      if (err) {
        console.log("Error in saving: " + err.message + '\n action:' + JSON.stringify(act));
        return res.status(500).json({error: err.message});
      } else {
        mailer.sendMail(action.owner.email, action.title, function(err, info) {
          if (err) {
            console.log("Error in sending email: " + err.message);
          } else {
            console.log("Sent mail: " + JSON.stringify(info));
          }
        });

        return res.status(200).json(action);
      }
    });
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

    // owner changed
    if (req.body.hasOwnProperty('owner')) {
      updateUserInfo(req.body.owner, function(err, owner) {
        if (err) {
          return next(err);
        }
        action.owner = owner;
      });

      // Send email to new owner
      mailer.sendMail(action.owner.email, action.title, function(err, info) {
        if (err) {
          console.log("Error in sending email: " + err.message);
        } else {
          console.log("Sent mail: " + JSON.stringify(info));
        }
      });
    };

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