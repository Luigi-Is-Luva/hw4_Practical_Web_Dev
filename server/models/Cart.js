const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItemId: String,
  name:       String,
  price:      Number,
  quantity:   Number,
  imageKey:   String,
});

const cartSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    items:     [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
