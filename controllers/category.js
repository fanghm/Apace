var Category = require('../models').Category;

exports.getCategories = function (callback) {
  var query = { deleted: false };
  Category.find(query, 'category short -_id', function (err, categories) {
    if (err) {
      return callback(err);
    }

    return callback(null, categories);
  });
};