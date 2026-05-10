const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: String,
  name:       String,
  price:      Number,
  quantity:   Number,
  imageKey:   String,
});

const orderSchema = new mongoose.Schema(
  {
    items:  [orderItemSchema],
    total:  { type: Number, required: true },
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'preparing', 'ready', 'cancelled'],
      default: 'pending',
    },
    customerName:  { type: String, default: '' },
    customerEmail: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
