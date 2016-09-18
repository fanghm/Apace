var _       = require('lodash');
var User    = require('../models').User;
var ldap    = require('../middlewares/ldap_auth');

function guess_uid_type(uid) {
  var re_id  = /^[1-9]\d{7}$/;
  var re_mail = /[\w.]+@nokia.com$/;
  var filter  = '';

  if (re_id.test(uid)) {
    return 'employeeNumber';
  } else if (re_mail.test(uid)) {
    return 'mail';
  } else {
    return 'uid';
  }
}

exports.login = function (req, res, next) {
  var uid   = _.trim(req.body.uid);
  var pass  = _.trim(req.body.pass);

  if (!uid || !pass) {
    return res.status(200).json(Error('Bad uid or pass.'));
  }

  auth(uid, pass, function(err, user) {
    if (!err) {
      //req.session.user = new User(user);
      return res.status(200).json(user);
    } else {
      return res.status(403).json(err);
    }
  });

};

function auth(uid, pass, cb) {
  var uid_type = guess_uid_type(uid);

  var query = {};
  query[uid_type] = uid; // find user by uid, mail, or uidNumber
  User.findOne(query, function(err, user) {
    if (user && typeof (user.uidNumber) !== 'undefined') {
      console.log("User exists in db: " + JSON.stringify(user));

      // Note: ONLY employeeNumber can be used for authentication
      var dn = "employeeNumber=" + user.uidNumber + ",ou=Internal,ou=People,o=NSN";
      ldap.authenticate(dn, pass, function(error) {
        if(error) {
          return cb(error);
        } else {
          // In case uidNumber imported into db, need one more update here to add other missing user info
          return cb(null, user);
        }
      });

      return;
    }

    // User not in db
    ldap.search(uid_type + "=" + uid, function(err, entry) {
      if (err) {
        console.log("Error in LDAP search: " + err.message);
        return cb(err);
      }

      var user = {
        uidNumber:  entry.uidNumber,
        uid:        entry.uid,
        mail:       entry.mail,
        name:       entry.cn,
        update_at:  Date.now()
      };

      // Update users whose email are imported
      User.update({mail: entry.mail}, user, {upsert: true}, function(err, raw) {
        if (err) {
          return cb(err);
        }

        var dn = "employeeNumber=" + entry.uidNumber + ",ou=Internal,ou=People,o=NSN";
        ldap.authenticate(dn, pass, function(error) {
          if(error) {
            return cb(error);
          } else {
            console.log("Updated: " + JSON.stringify(raw));
            return cb(null, user);
          }
        });

      }); // end of create
    }); // end of search
  }); // end of findOne
}
