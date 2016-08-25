var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var ActionSchema = new Schema({
  title: { type: String },
  status: { type: String },
  owner: { type: String },

  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  
  deleted: {type: Boolean, default: false},
});


ActionSchema.index({status: 1});
ActionSchema.index({author_id: 1, create_at: -1});

mongoose.model('Action', ActionSchema);