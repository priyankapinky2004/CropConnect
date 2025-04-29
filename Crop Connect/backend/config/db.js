const mongoose = require('mongoose');

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Alternative in-memory/file storage for hackathon quick setup
const inMemoryDB = {
  users: [],
  crops: [],
  orders: [],
  
  // Helper methods for file-based DB operations
  saveUser: function(user) {
    const newUser = { ...user, _id: Date.now().toString() };
    this.users.push(newUser);
    return newUser;
  },
  
  findUserByEmail: function(email) {
    return this.users.find(user => user.email === email);
  },
  
  saveCrop: function(crop) {
    const newCrop = { ...crop, _id: Date.now().toString() };
    this.crops.push(newCrop);
    return newCrop;
  },
  
  findCropsBySellerId: function(sellerId) {
    return this.crops.filter(crop => crop.sellerId === sellerId);
  },
  
  getAllCrops: function() {
    return this.crops;
  },
  
  saveOrder: function(order) {
    const newOrder = { ...order, _id: Date.now().toString() };
    this.orders.push(newOrder);
    return newOrder;
  },
  
  findOrdersByUserId: function(userId) {
    return this.orders.filter(order => order.customerId === userId);
  }
};

module.exports = {
  connectDB,
  inMemoryDB
};