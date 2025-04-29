// Save this as initialize-data.js in your backend folder

const admin = require('firebase-admin');

// Choose ONE of these initialization methods:

// OPTION 1: Use a direct path to your service account file
// Replace 'serviceAccountKey.json' with your actual filename
// const serviceAccount = require('./serviceAccountKey.json');

// OPTION 2: Initialize with environment variable
// This is safer for production but requires setting GOOGLE_APPLICATION_CREDENTIALS
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? undefined  // Will use the env variable automatically
  : require('./serviceAccountKey.json'); // Fallback to local file

// Initialize Firebase
try {
  if (!admin.apps.length) {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase initialized with service account file');
    } else {
      // Will use GOOGLE_APPLICATION_CREDENTIALS env variable
      admin.initializeApp();
      console.log('Firebase initialized with environment credentials');
    }
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  process.exit(1);
}

const db = admin.firestore();

// Sample crop data
const sampleCrops = [
  {
    name: 'Organic Tomatoes',
    description: 'Fresh organic tomatoes grown without pesticides. Perfect for salads and cooking.',
    price: 3.99,
    quantity: 50,
    unit: 'kg',
    location: 'Cropville Farms',
    sellerName: 'John Farmer',
    sellerId: 'user123', // Replace with actual user ID if needed
    harvestDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    category: 'vegetables'
  },
  {
    name: 'Fresh Apples',
    description: 'Sweet and juicy apples freshly picked from our orchard. Great for snacking or baking.',
    price: 2.49,
    quantity: 100,
    unit: 'kg',
    location: 'Apple Valley',
    sellerName: 'John Farmer',
    sellerId: 'user123',
    harvestDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    category: 'fruits'
  },
  {
    name: 'Organic Potatoes',
    description: 'Locally grown organic potatoes. Versatile for many dishes.',
    price: 1.99,
    quantity: 75,
    unit: 'kg',
    location: 'Cropville Farms',
    sellerName: 'John Farmer',
    sellerId: 'user123',
    harvestDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    category: 'vegetables'
  },
  {
    name: 'Fresh Strawberries',
    description: 'Sweet and juicy strawberries, perfect for desserts or snacking.',
    price: 4.99,
    quantity: 30,
    unit: 'kg',
    location: 'Berry Fields',
    sellerName: 'Sarah Grower',
    sellerId: 'user456',
    harvestDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    category: 'fruits'
  },
  {
    name: 'Organic Brown Rice',
    description: 'Nutrient-rich brown rice, grown organically without chemicals.',
    price: 3.49,
    quantity: 200,
    unit: 'kg',
    location: 'Golden Fields',
    sellerName: 'Sarah Grower',
    sellerId: 'user456',
    harvestDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    category: 'grains'
  },
  {
    name: 'Fresh Mint',
    description: 'Aromatic mint leaves, great for teas, cocktails, and cooking.',
    price: 1.99,
    quantity: 20,
    unit: 'kg',
    location: 'Herb Garden',
    sellerName: 'Mike Herbs',
    sellerId: 'user789',
    harvestDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    category: 'herbs'
  }
];

// Add crops to Firestore
async function populateDatabase() {
  try {
    console.log('Starting database population...');
    const cropsCollection = db.collection('crops');
    
    // Add each crop to Firestore
    for (const crop of sampleCrops) {
      await cropsCollection.add(crop);
      console.log(`Added crop: ${crop.name}`);
    }
    
    console.log('Database population completed successfully!');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

// Run the function
populateDatabase().then(() => {
  console.log('Script completed. You can now restart your server.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});