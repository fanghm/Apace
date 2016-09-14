var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;

var UserSchema = new Schema({
  uid: { type: Number },      // employeeNumber or uidNumber
  name: { type: String},      // nsnPreferredName + sn
  loginname: { type: String}, // nsnDomainId or uid

  email: { type: String},     // mail
  mobile: { type: String},    // mobile

  cc: { type: String},        // nsnCostCentre
  team: { type: String},      // nsnTeamName
  biz_unit: { type: String }, // ou

  // signature: { type: String }, // for displaying in update history
  // profile: { type: String },

  is_block: {type: Boolean, default: false },  
  active: { type: Boolean, default: true },  // nsnStatus

  receive_reply_mail: {type: Boolean, default: false },
  receive_at_mail: { type: Boolean, default: false },
  
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },  
});

UserSchema.plugin(BaseModel);

UserSchema.virtual('isTdd').get(function () {
  // 积分高于 700 则认为是高级用户
  return this.biz_unit === 'MBB TD LTE';
});

UserSchema.index({loginname: 1}, {unique: true});
UserSchema.index({email: 1}, {unique: true});
UserSchema.index({uid: 1}, {unique: true});
UserSchema.index({team: 1});

mongoose.model('User', UserSchema);
