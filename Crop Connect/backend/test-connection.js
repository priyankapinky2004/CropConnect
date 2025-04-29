// Create a file named test-connection.js in your backend folder

const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI from environment or use default
const mongoURI = process.env.MONGO_URI || 'mmongodb://localhost:27017/Crop20Connect';

console.log('Attempting to connect to MongoDB at:', mongoURI);

// Connect with improved options
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✓ MongoDB Connected Successfully');
  console.log('Connection state:', mongoose.connection.readyState);
  
  // List all collections in the database
  mongoose.connection.db.listCollections().toArray()
    .then((collections) => {
      console.log('Collections in database:');
      collections.forEach((collection) => {
        console.log(` - ${collection.name}`);
      });
      
      // Exit process after checking
      console.log('Database connection test completed successfully.');
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error listing collections:', err);
      mongoose.connection.close();
      process.exit(1);
    });
})
.catch((err) => {
  console.error('✗ MongoDB Connection Error:', err.message);
  
  // More detailed error diagnosis
  if (err.name === 'MongoServerSelectionError') {
    console.error('  → Unable to reach MongoDB server. Check your connection string and ensure MongoDB is running.');
    
    // Check if MongoDB is installed
    console.log('Troubleshooting tips:');
    console.log('1. Make sure MongoDB server is running:');
    console.log('   - On Windows: Check Services or run "net start MongoDB"');
    console.log('   - On macOS/Linux: Run "sudo systemctl status mongodb" or "brew services list"');
    console.log('2. Verify your connection string in .env file');
    console.log('3. Check if MongoDB port is accessible (default: 27017)');
  } else if (err.name === 'MongoParseError') {
    console.error('  → Invalid MongoDB connection string format.');
    console.log('Correct format: mongodb://[username:password@]host[:port]/database');
  }
  
  process.exit(1);
});

// Log connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Run this script with: node test-connection.js