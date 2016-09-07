var mongoose  = require('mongoose');
var BaseModel  = require('./base_model');

var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var ActionSchema = new Schema({
  title:      { type: String, required: true },
  desc:       { type: String },
  status:     { type: String, required: true,
                enum: ['New', 'Ongoing', 'Done', 'Cancelled', 'Blocked', 'Suspended'] },

  category:   { type: String, required: true,
                enum: ['RCA/EDA', 'Retrospective', 'CIF meeting', 'Internal Audit', 'Other'] },
  source:     { type: String }, // optional: PR/Feature ID, etc
  team:       { type: String }, // optional, for team APs

  le:         { type: Date, required: true },   // latest estimation
  owner:      { type: String },
  creator:    { type: String }, // auto fill

  history:    { type: String }, // eg: [2016/09/01] created by xxx
  //updated_by: { type: String },

  create_at:  { type: Date, default: Date.now },
  update_at:  { type: Date, default: Date.now },
  
  deleted:    {type: Boolean, default: false},
});

ActionSchema.plugin(BaseModel);
ActionSchema.index({status: 1});
ActionSchema.index({category: 1, create_at: -1});

mongoose.model('Action', ActionSchema);