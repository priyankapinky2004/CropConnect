// Save this as server.js in your backend folder

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

// Initialize app
const app = express();

console.log("Initializing Firebase Admin SDK...");

// IMPORTANT: Initialize Firebase FIRST, before importing routes
try {
  // Use the service account file
  const serviceAccount = require('./serviceAccountKey.json');
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized successfully with service account');
  }
} catch (error) {
  console.error('⚠️ Error initializing Firebase with service account:', error);
  
  try {
    // Fallback to environment variable or default config
    if (!admin.apps.length) {
      admin.initializeApp();
      console.log('✅ Firebase Admin SDK initialized with environment credentials');
    }
  } catch (fallbackError) {
    console.error('❌ Firebase initialization completely failed:', fallbackError);
    process.exit(1); // Exit if Firebase can't be initialized
  }
}

// Get a Firestore reference
const db = admin.firestore();

// Test Firestore connection
db.collection('crops').limit(1).get()
  .then(snapshot => {
    console.log(`✅ Firestore connection test successful. Found ${snapshot.size} document(s).`);
  })
  .catch(error => {
    console.error('❌ Firestore connection test failed:', error);
  });

// ONLY import routes AFTER Firebase is initialized
// NOTE: We're not using route modules for simplicity, defining routes inline instead
// const cropRoutes = require('./routes/cropRoutes');

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Serve static files from frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
}

// Define routes directly in server.js for now
// GET all crops
app.get('/api/crops', async (req, res) => {
  try {
    console.log('Fetching all crops...');
    const cropsSnapshot = await db.collection('crops').get();
    
    if (cropsSnapshot.empty) {
      console.log('No crops found in database');
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    const crops = [];
    cropsSnapshot.forEach(doc => {
      crops.push({
        _id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${crops.length} crops`);
    return res.status(200).json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// GET single crop by ID
app.get('/api/crops/:id', async (req, res) => {
  try {
    const cropId = req.params.id;
    console.log(`Fetching crop with ID: ${cropId}`);
    
    const cropDoc = await db.collection('crops').doc(cropId).get();
    
    if (!cropDoc.exists) {
      console.log(`Crop with ID ${cropId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }
    
    const cropData = {
      _id: cropDoc.id,
      ...cropDoc.data()
    };
    
    console.log(`Found crop: ${cropData.name}`);
    return res.status(200).json({
      success: true,
      data: cropData
    });
  } catch (error) {
    console.error('Error fetching crop:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h1>CropConnect API is Running</h1>
    <p>Server is up and Firebase is connected.</p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/crops">/api/crops</a> - Get all crops</li>
    </ul>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📊 API URL: http://localhost:${PORT}/api/crops
  
  Open in your browser to test: http://localhost:${PORT}
  `);
});