var mongoose  = require('mongoose');
var BaseModel = require('./base_model');

var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var ActionSchema = new Schema({
  title:      { type: String, required: true },
  desc:       { type: String },

  category:   { type: String, required: true },
  ref:        { type: String },   // reference: optional, PR#, Feature ID, etc

  owner:      { uid: Number, name: String, email: String },
  le:         { type: Date, required: true },   // LE: latest estimation

  status:     { type: String, required: true },
  history:    [ { info: String, by: String, at: Date } ], // eg: [2016/09/01] frank: first created

  attachments:[ { name: String, size: String } ],

  author_id:  { type: Number }, // User.uidNumber

  create_at:  { type: Date, default: Date.now },
  update_at:  { type: Date, default: Date.now },
  
  deleted:    {type: Boolean, default: false},
});

ActionSchema.plugin(BaseModel);

ActionSchema.index({status: 1});
ActionSchema.index({category: 1, create_at: -1});

mongoose.model('Action', ActionSchema);