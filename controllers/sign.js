
var _       = require('lodash');
var User    = require('../models').User;
var config  = require('../config');
var ldap    = require('../middlewares/ldap_auth');

exports.login = function (req, res, next) {
  var uid   = _.trim(req.body.uid);
  var pass  = _.trim(req.body.pass);

  if (!uid || !pass) {
    console.log("uid: " + uid + ", pass: " + pass);
    return res.status(200).json({error: 'Bad uid or pass.'});
  }

  auth(uid, pass, function(err, user) {
    if (!err) {
      req.session.user = user;
      return res.status(200).json({user: user});
    } else {
      return res.status(200).json({error: err.message});
    }
  });

};

function auth(uid, pass, cb) {
  User.findOne({uid: uid}, function(err, user) {
    if (user) {
      ldap.auth(user.dn, pass, function(error) {
        if(error) {
          return cb({error: 'Login failed: ' + error.message});
        } else {
          return cb(null, user);
        }
      });
    }

    // find error or user not in db
    ldap.search(uid, function(err, entry) {
      if (err) return cb(err);

      var user = {
        uid:        entry.uid,
        dn:         entry.dn,
        loginname:  entry.uid,
        name:       entry.cn,
        email:      entry.mail,
        mobile:     entry.mobile,
         
      };

      User.create(user, function(err, created) {
        if (err) return cb(err);

        ldap.auth(entry.dn, pass, function(error) {
          if(error) {
            return cb(error);
          } else {
            return cb(null, created);
          }
        });

      }); // end of create
    }); // end of search
  }); // end of findOne
}
