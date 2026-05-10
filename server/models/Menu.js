const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    ingredients: { type: String, required: true },
    price:       { type: Number, required: true },
    imageKey:    { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);
