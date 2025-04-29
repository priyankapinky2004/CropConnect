const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  cropId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Crop',
    required: true
  },
  cropName: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  sellerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify quantity']
  },
  unit: {
    type: String,
    default: 'kg'
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Please add a delivery address']
  },
  contactPhone: {
    type: String,
    required: [true, 'Please add a contact phone number']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Orders', OrderSchema);