/**
 * 给所有的 Model 扩展功能
 * http://mongoosejs.com/docs/plugins.html
 */
var tools = require('../common/tools');

module.exports = function (schema) {
  schema.methods.create_at_ago = function () {
    return tools.formatDate(this.create_at, true);
  };

  schema.methods.update_at_time = function () {
    return tools.formatDate(this.update_at, false);
  };

  schema.methods.format = function(date_field, friendly) {
    if (Object.getPrototypeOf(this).hasOwnProperty(date_field)) {
      return tools.formatDate(this[date_field], friendly);
    } else if (this.hasOwnProperty(date_field)) {
      return tools.formatDate(this[date_field], friendly);
    } else {
      return 'Long long ago...'; // :)
    }
  };

};
