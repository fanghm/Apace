'use strict';
var ldap = require('ldapjs');
var config = require('../config');

var noop = function() {};

var get_opt = function(uid) {
  var re_uid  = /^[1-9]\d{7}$/;
  var re_mail = /[\w.]+@nokia.com$/;
  var filter  = '';

  if (re_uid.test(uid)) {
    filter = 'uidNumber=' + uid;
  } else if (re_mail.test(uid)) {
    filter = 'mail=' + uid;
  } else {
    filter = 'uid=' + uid;
  }
  
  return {
    filter: filter,
    scope: 'sub'
  };
};

module.exports = {

  authenticate: function(dn, password, callback) {
    //console.log("auth dn: " + dn + ", pwd: " + password);
    callback = callback || noop;

    var client = ldap.createClient({
      url: config.ldap_url
    });

    client.bind(dn, password, function(err) {
      client.unbind();
      return callback(err); // caller is responsible for checking err
    });
  },

  search: function(uid, callback) {
    callback = callback || noop;

    var client = ldap.createClient({
      url: config.ldap_url
    });

    client.bind('', '', function(err) {
      if (err) {
        return callback(err);
      }

      var opt = get_opt(uid);
      client.search('', opt, function(err, response) {
        var entrys = [];

        if (err) {
          client.unbind();
          return callback(err);
        }

        response.on('searchEntry', function(entry) {
          entrys.push(entry.object);
        });

        response.on('end', function() {
          client.unbind();

          if (entrys.length === 0) {
            return callback(Error('No such user: ' + uid), null);
          }

          var entry = entrys[0];
          //console.log("Found LDAP user:" + JSON.stringify(entry));
          return callback(null, entry);
        });

        response.on('error', function(error) {
          client.unbind();
          console.log('LDAP search error', error.message);
          return callback(error);
        });
      });
    });
  }

};
