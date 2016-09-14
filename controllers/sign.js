var _       = require('lodash');
var User    = require('../models').User;
var ldap    = require('../middlewares/ldap_auth');

exports.login = function (req, res, next) {
  var uid   = _.trim(req.body.uid);
  var pass  = _.trim(req.body.pass);

  if (!uid || !pass) {
    return res.status(200).json({error: 'Bad uid or pass.'});
  }

  auth(uid, pass, function(err, user) {
    if (!err) {
      // TODO: req.session.user = user;
      return res.status(200).json(user);
    } else {
      return res.status(200).json({error: err.message});
    }
  });

};

function auth(uid, pass, cb) {
  // TODO: use multiple possible query conditions, maybe uid, email, loginname
  User.findOne({uid: uid}, function(err, user) {
    if (user) {
      // console.log("User exists in db: " + JSON.stringify(user));
      var dn = '';
      if (user.hasOwnProperty('uid')) {
        dn = "employeeNumber=" + user.uid;
      } else if (user.hasOwnProperty('email')) {
        var dn = "mail=" + user.email;
      }
      dn += ",ou=Internal,ou=People,o=NSN";

      ldap.authenticate(dn, pass, function(error) {
        if(error) {
          return cb(error);
        } else {
          return cb(null, user);
        }
      });

      return;
    }

    // User not in db
    ldap.search(uid, function(err, entry) {
      if (err) {
        console.log("Error in LDAP search: " + err.message);
        return cb(err);
      }

      var user = {
        uid:        entry.uidNumber,  // or employeeNumber
        loginname:  entry.uid,
        email:      entry.mail,       // or nsnPrimaryEmailAddress
        name:       entry.cn,         // or gecos
        // and more...
      };

      User.create(user, function(err, created) {
        if (err) {
          return cb(err);
        }

        var dn = "employeeNumber=" + entry.uid + ",ou=Internal,ou=People,o=NSN";
        ldap.authenticate(dn, pass, function(error) {
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
