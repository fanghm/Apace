var mongoose  = require('mongoose');
var BaseModel = require('./base_model');

var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var ActionSchema = new Schema({
  title:      { type: String, required: true },
  desc:       { type: String },

  category:   { type: String, required: true,
                enum: ['RCA/EDA', 'Retrospective', 'CIF meeting', 'Internal Audit', 'Other'] },
  ref:        { type: String },   // reference: optional, PR#, Feature ID, etc

  owner:      { type: String, required: true },
  le:         { type: Date, required: true },   // LE: latest estimation

  status:     { type: String, required: true,
                enum: ['New', 'Ongoing', 'Done', 'Cancelled', 'Blocked', 'Suspended'] },
  history:    [ { info: String, by: String, at: Date, status: String } ], // eg: [2016/09/01] frank: first created

  author:     { type: String },
  // author_id:  { type: ObjectId },

  create_at:  { type: Date, default: Date.now },
  update_at:  { type: Date, default: Date.now },
  
  deleted:    {type: Boolean, default: false},
});

ActionSchema.plugin(BaseModel);

ActionSchema.index({status: 1});
ActionSchema.index({category: 1, create_at: -1});

mongoose.model('Action', ActionSchema);