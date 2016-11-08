var Action       = require('../models').Action;
var User         = require('../models').User;
var UserCtrl     = require('./user');
var Setting      = require('../models').Setting;
var CategoryCtrl = require('./category');
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
  var query = { deleted: false };
  if (req.query.category) {
    console.log("category:" + req.query.category);
    query.category = req.query.category;
  }

  _index(req, res, next, query);
}

exports.edit = function(req, res, next) {
  var action_id = req.params.id;
  console.log("edit id:" + action_id);

  var query = { deleted: false, _id: require('mongoose').Types.ObjectId(action_id)};

  _index(req, res, next, query);
}

var _index = function(req, res, next, query) {
  var ep = EventProxy.create();
  ep.fail(next);

  var options = { sort: 'create_at' };
  getActionsByQuery(query, options, ep.done('actions', function (actions) {
    return actions;
  }));

  UserCtrl.getUsers(ep.done('users', function (users) {
    return users;
  }));

  CategoryCtrl.getCategories(ep.done('categories', function (categories) {
    return categories;
  }));

  ep.all('actions', 'users', 'categories', function (actions, users, categories) {
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
    });
    // console.log("action_map: " + JSON.stringify(action_map));

    var data = {
      actions: actions,
      action_map: JSON.stringify(action_map),
      name_suggestions: JSON.stringify(users),
      action_categories: categories,
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

  proxy.all('email', function (mail) {
    act.save(function (err, action, numAffected) {
      if (err) {
        console.log("Error in saving: " + err.message + '\n action:' + JSON.stringify(act));
        return res.status(500).json({error: err.message});
      } else {
        mailer.sendMail(action, function(err, info) {
          if (err) {
            console.log("Error in sending email: " + err.message);
          } else {
            console.log("Sent mail: " + JSON.stringify(info));
          }
        });

        console.log("action added: " + JSON.stringify(act));
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
      mailer.sendMail(action, function(err, info) {
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
};

// handle shortcut routes with in-built filters, for quick access
exports.route = function(req, res, next) {
  var url = validator.trim(req.url);//.toLowerCase();

  switch(url) {
    case '/cif':
      //console.log('redirect: ' + config.app_url + '/category="CIF Meeting"')
      res.redirect(config.app_url + '/?category=CIF Meeting');
    break;

  default:
    return res.status(200).json({url: url});
  }
};

exports.upload = function(req, res, next) {
  var storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, config.upload_path);
    },
    filename: function (req, file, callback) {
      var filename = file.originalname;
      if (file.originalname.length > 45) {
        filename = file.originalname.substr(-45);
      }

      callback(null, Date.now() + '_' + filename);
    }
  });

  var upload = multer({ storage: storage }).single('upl');

  upload(req, res, function(err) {
    if(err) {
      console.log("Error uploading file: " + err.message);
      return res.status(500).end();
    }

    if (!req.body.dataId) {
      return res.status(500).end();
    }

    // console.log('upload file: ' + JSON.stringify(req.file));
    Action.findOne({_id: req.body.dataId, deleted: false}, function (err, action) {
      if (err) {
        return res.status(500).json({ msg: err.message });
      }

      if (!action) {
        return res.status(500).json({ msg: 'Action not found: _id = ' + action_id });
      }

      var attachment = {name: req.file.filename, size: req.body.size};
      action.attachments.push(attachment);

      action.update_at = Date.now();
      action.save(function (err, action, numAffected) {
        if (err) {
          console.log("Error in saving to DB: " + err.message + '\n action:' + JSON.stringify(action));
          return res.status(500).json({error: err.message});
        }

        res.status(200).json(attachment); // return 200 due to 204 No Content
      });

    });

    // console.log("upload req.body: " + JSON.stringify(req.body));
  });
};

// remove an attachment from specific action
exports.unload = function(req, res, next) {
  if (!req.body.dataId || !req.body.name) {
    return res.status(500).end();
  }

  Action.findOne({_id: req.body.dataId, deleted: false}, function (err, action) {
    if (err) {
      return res.status(500).json({ msg: err.message });
    }

    if (!action) {
      return res.status(500).json({ msg: 'Action not found: _id = ' + action_id });
    }

    var found = false;
    for(var i=0; i<action.attachments.length; i++) {
      if(action.attachments[i].name === req.body.name) {
        found = true;
        action.attachments.splice(i, 1);
      }
    }

    if (!found) {
      return res.status(500).json({ msg: 'attachment not found in specified action' });
    }

    action.update_at = Date.now();
    action.save(function (err, action, numAffected) {
      if (err) {
        console.log("Error in saving to DB: " + err.message + '\n action:' + JSON.stringify(action));
        return res.status(500).json({error: err.message});
      }

      // remove the file
      require('fs').unlink(config.upload_path + req.body.name, (err) => {
        if (err) {
          console.log('Fail to remove file: ' + req.body.name);
        }
      });

      res.status(200).json(action);
    });

  });
};