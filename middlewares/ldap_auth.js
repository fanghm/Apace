'use strict';

var ldap = require('ldapjs');
var config = require('../config');
var noop = function() {};

var get_opt = function(uid) {

  var re_uid = /^[1-9]\d{7}$/;
  var re_mail = /[\w.]+@nokia.com$/;
  var filter = '';

  if (re_uid.test(uid)) {
    filter = 'uidNumber=' + uid;
  } else if (re_mail.test(uid)) {
    filter = 'mail=' + uid;
  } else {
    filter = 'uid=' + uid;
  }
  
  console.log("filter: " + filter);
  return {
    filter: filter,
    scope: 'sub'
  };
};

module.exports = {

  auth: function(dn, password, callback) {
    callback = callback || noop;

    var client = ldap.createClient({
      url: config.ldap_url
    });

    client.bind(dn, password, function(err) {
      return callback(err);
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
          return callback(err);
        }

        response.on('searchEntry', function(entry) {
          entrys.push(entry.object);
        });

        response.on('end', function() {
          if (entrys.length === 0) {
            return callback(Error('No such uid: ' + uid), null);
          }

          var entry = entrys[0];
          console.log("LDAP user:" + JSON.stringify(entry));

          return callback(null, entry);
        });

        response.on('error', function(error) {
          console.log('LDAP search error', error.messsage);
          return callback(error);
        });
      });
    });
  }

};
