var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;

var CategorySchema = new Schema({
  category:   { type: String, required: true },
  short:      { type: String }, // short url for quick access

  create_at:  { type: Date, default: Date.now },
  update_at:  { type: Date, default: Date.now },
  updater:    { type: String },
  deleted:    {type: Boolean, default: false},
});

CategorySchema.plugin(BaseModel);
mongoose.model('Category', CategorySchema);
