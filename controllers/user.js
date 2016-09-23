var User    = require('../models').User;


// include removed users
exports.getUserById = function(uid, callback) {
  if (!uid) {
    return callback();
  }
  User.findOne({uidNumber: uid}, callback);
}

exports.getUserMailById = function(uid, callback) {
  if (!uid) {
    return callback();
  }
  User.findOne({uidNumber: uid}, 'mail -_id', callback);
};

exports.getUserByMail = function(email, callback) {
  if (!email) {
    return callback();
  }
  User.findOne({mail: email}, 'uidNumber name', callback);
};

exports.getUsers = function (callback) {
  // return { value: 'name', data: uidNumber } to meet format requirement of jquery.autocomplete
  User.aggregate({ $match: { "uidNumber":{$exists:true}, "name":{$exists:true}} }
    ,{ $project: { value: "$name", data: "$uidNumber", _id:0 } }
    , function (err, users) {
    if (err) {
      return callback(err);
    }

    if (users.length === 0) {
      return callback(null, []);
    }

    return callback(null, users);
  });
};