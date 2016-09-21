'use strict';
var ldap = require('ldapjs');
var config = require('../config');

var noop = function() {};

module.exports = {
  authenticate: function(dn, password, callback) {
    // console.log("auth dn: " + dn);
    callback = callback || noop;

    var client = ldap.createClient({
      url: config.ldap_url
    });

    client.bind(dn, password, function(err) {
      client.unbind();
      return callback(err); // caller is responsible for checking err
    });
  },

  search: function(filter, callback) {
    callback = callback || noop;

    var client = ldap.createClient({
      url: config.ldap_url
    });

    client.bind('', '', function(err) {
      if (err) {
        return callback(err);
      }

      var opt = {
        filter: filter,
        scope: 'sub'
      };

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
            return callback(Error('No such user whose ' + filter), null);
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
