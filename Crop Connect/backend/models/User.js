const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create User Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['seller', 'customer', 'admin'],
    default: 'customer'
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  },
  created: {
    type: Date,
    default: Date.now
  },
  // Fields for farmers (sellers)
  farmName: {
    type: String,
    default: ''
  },
  farmDescription: {
    type: String,
    default: ''
  },
  // Fields for customers
  preferences: {
    organic: {
      type: Boolean,
      default: false
    },
    categories: {
      type: [String],
      default: []
    }
  },
  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  // Enable virtuals
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's full profile URL
UserSchema.virtual('profileUrl').get(function() {
  return `/profiles/${this._id}`;
});

// Method to check if user is seller
UserSchema.methods.isSeller = function() {
  return this.role === 'seller';
};

// Method to check if user is customer
UserSchema.methods.isCustomer = function() {
  return this.role === 'customer';
};

// Method to check if user is admin
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

module.exports = mongoose.model('User', UserSchema);