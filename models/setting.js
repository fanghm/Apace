var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;

var SettingSchema = new Schema({
  category:   [String],
  status:     [String],
  
  create_at:  Date,
  update_at:  Date
});

SettingSchema.plugin(BaseModel);
mongoose.model('Setting', SettingSchema);