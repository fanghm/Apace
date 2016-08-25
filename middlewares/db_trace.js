var config = require('../config');
var mongoose = require('mongoose');
var logger = require('../common/logger');

if (config.debug) {
  var traceMQuery = function (method, info, query) {
    return function (err, result, millis) {
      if (err) {
        logger.error('traceMQuery error:', err)
      }

      var infos = [];
      if (method.substring(0, 4) !== "find") {
        infos.push("db." + query._collection.collection.name + "." + method.blue);
        infos.push(JSON.stringify(info));
      } else {
        // TODO: *id within conditions should be converted to ObjectId
        infos.push("db." + query._collection.collection.name + "." + method.blue
          + "(" + JSON.stringify(info.conditions) + ", " + JSON.stringify(info.options) + ")" );
      }
      
      infos.push((millis + 'ms').green);
      
      infos.push('\n' + JSON.stringify(result).grey + '\n');
      //infos.push((JSON.parse(result).length + 'results').red);
      
      logger.debug("MONGO".magenta, infos.join(' '));
    };
  };

  mongoose.Mongoose.prototype.mquery.setGlobalTraceFunction(traceMQuery);
}
