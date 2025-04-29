const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a crop name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price per kg']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add available quantity']
  },
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'g', 'lb', 'ton']
  },
  location: {
    type: String,
    required: [true, 'Please add harvest location']
  },
  harvestDate: {
    type: Date,
    default: Date.now
  },
  cropImage: {
    type: String,
    default: 'default-crop.png'
  },
  sellerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Crop', CropSchema);