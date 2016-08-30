var mongoose  = require('mongoose');
var BaseModel  = require('./base_model');

var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var ActionSchema = new Schema({
  title:      { type: String, required: true },
  details:    { type: String },
  status:     { type: String,
                enum: ['New', 'Ongoing', 'Done', 'Cancelled', 'Blocked', 'Suspended'] },

  category:   { type: String,
                enum: ['RCA/EDA', 'Retrospective', 'CIF', 'Other'] },

  team:       { type: String },
  owner:      { type: String },
  creator:    { type: String },
  due_date:   { type: Date},

  progress:   { type: String },

  create_at:  { type: Date, default: Date.now },
  update_at:  { type: Date, default: Date.now },
  
  deleted:    {type: Boolean, default: false},
});

ActionSchema.plugin(BaseModel);
ActionSchema.index({status: 1});
ActionSchema.index({author_id: 1, create_at: -1});

mongoose.model('Action', ActionSchema);