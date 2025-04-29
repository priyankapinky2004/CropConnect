// Save this in your backend/routes/cropRoutes.js file

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firebase is initialized
const db = admin.firestore();

// GET all crops
router.get('/', async (req, res) => {
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

// GET crops by seller ID
router.get('/seller/my-crops', async (req, res) => {
  try {
    // Get user ID from authenticated user
    const sellerId = req.user.uid; // Assuming req.user is set by auth middleware
    
    console.log(`Fetching crops for seller ${sellerId}...`);
    const cropsSnapshot = await db.collection('crops')
      .where('sellerId', '==', sellerId)
      .get();
    
    if (cropsSnapshot.empty) {
      console.log('No crops found for this seller');
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
    
    console.log(`Found ${crops.length} crops for seller ${sellerId}`);
    return res.status(200).json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (error) {
    console.error('Error fetching seller crops:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// GET single crop by ID
router.get('/:id', async (req, res) => {
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

// POST create new crop
router.post('/', async (req, res) => {
  try {
    // Get user ID from authenticated user
    const sellerId = req.user.uid; // Assuming req.user is set by auth middleware
    const sellerName = req.user.name || 'Unknown Farmer';
    
    const cropData = {
      ...req.body,
      sellerId,
      sellerName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log(`Creating new crop: ${cropData.name}`);
    const cropRef = await db.collection('crops').add(cropData);
    
    console.log(`Created crop with ID: ${cropRef.id}`);
    return res.status(201).json({
      success: true,
      data: {
        _id: cropRef.id,
        ...cropData
      }
    });
  } catch (error) {
    console.error('Error creating crop:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// PUT update crop
router.put('/:id', async (req, res) => {
  try {
    const cropId = req.params.id;
    const sellerId = req.user.uid; // Assuming req.user is set by auth middleware
    
    // Check if crop exists and belongs to the seller
    const cropDoc = await db.collection('crops').doc(cropId).get();
    
    if (!cropDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }
    
    const cropData = cropDoc.data();
    if (cropData.sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this crop'
      });
    }
    
    // Update crop
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    console.log(`Updating crop with ID: ${cropId}`);
    await db.collection('crops').doc(cropId).update(updateData);
    
    console.log(`Updated crop: ${updateData.name || cropData.name}`);
    return res.status(200).json({
      success: true,
      data: {
        _id: cropId,
        ...cropData,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Error updating crop:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// DELETE crop
router.delete('/:id', async (req, res) => {
  try {
    const cropId = req.params.id;
    const sellerId = req.user.uid; // Assuming req.user is set by auth middleware
    
    // Check if crop exists and belongs to the seller
    const cropDoc = await db.collection('crops').doc(cropId).get();
    
    if (!cropDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }
    
    const cropData = cropDoc.data();
    if (cropData.sellerId !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this crop'
      });
    }
    
    console.log(`Deleting crop with ID: ${cropId}`);
    await db.collection('crops').doc(cropId).delete();
    
    console.log(`Deleted crop: ${cropData.name}`);
    return res.status(200).json({
      success: true,
      message: 'Crop deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting crop:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = router;