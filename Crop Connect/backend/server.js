const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const cropRoutes = require('./routes/crops');
const orderRoutes = require('./routes/orders');

// Initialize express app
const app = express();
console.log("Loading server.js");
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for production (when frontend is built)
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/orders', orderRoutes);

// Serve index.html for all other routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});


mongoose.connect('mongodb://localhost:27017/Crop20Connect', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB Connected...');
})
.catch((err) => {
    console.error('MongoDB connection error:', err.message);
});

// Database connection
const connectDB = async () => {
  try {
    // If MongoDB connection string is provided, use it
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB Connected...');
    } else {
      console.log('MongoDB connection string not provided. Using in-memory data.');
      // In a real project, you'd set up a file-based DB alternative here
    }
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
};

// Call the connectDB function
connectDB();

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});