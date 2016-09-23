var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;

var UserSchema = new Schema({
  uidNumber: { type: Number },
  uid:       { type: String },
  mail:      { type: String },

  name:      { type: String },
  alias:     { type: String },

  // team:      { type: String },
  // biz_unit:  { type: String },
  
  create_at: { type: Date },
  update_at: { type: Date },

  // don't remove user records, update this flag only
  deleted:   { type: Boolean, default: false },
});

UserSchema.plugin(BaseModel);

UserSchema.index({uidNumber: 1}, {unique: true});
UserSchema.index({mail: 1}, {unique: true});
UserSchema.index({uid: 1}, {unique: true});

mongoose.model('User', UserSchema);
