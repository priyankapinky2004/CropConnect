
// backend/controllers/cropController.js
const { db, admin, storage } = require('../firebase');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Setup multer for file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to upload a file to Firebase Storage
const uploadFileToFirebase = async (file) => {
  try {
    if (!file) return null;
    
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = `crops/${fileName}`;
    const fileUpload = storage.file(filePath);
    
    const fileStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });
    
    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => {
        reject(error);
      });
      
      fileStream.on('finish', async () => {
        // Make the file publicly accessible
        await fileUpload.makePublic();
        
        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${storage.name}/${filePath}`;
        resolve(publicUrl);
      });
      
      fileStream.end(file.buffer);
    });
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// @desc    Add a new crop
// @route   POST /api/crops
// @access  Private (Sellers only)
exports.addCrop = async (req, res) => {
  try {
    upload.single('cropImage')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }
      
      try {
        const { name, description, price, quantity, unit, location, harvestDate } = req.body;
        
        // Upload image if provided
        let cropImage = 'default-crop.png';
        if (req.file) {
          cropImage = await uploadFileToFirebase(req.file);
        }
        
        // Create crop in Firestore
        const cropRef = db.collection('crops').doc();
        const cropData = {
          id: cropRef.id,
          name,
          description,
          price: parseFloat(price),
          quantity: parseInt(quantity),
          unit: unit || 'kg',
          location,
          harvestDate: harvestDate || new Date().toISOString(),
          cropImage,
          sellerId: req.user.uid,
          sellerName: req.user.name,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await cropRef.set(cropData);
        
        res.status(201).json({
          success: true,
          data: cropData
        });
      } catch (error) {
        console.error('Add crop error:', error);
        res.status(500).json({
          success: false,
          message: 'Could not add crop',
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error('Add crop outer error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process request',
      error: error.message
    });
  }
};

// @desc    Get all crops
// @route   GET /api/crops
// @access  Public
exports.getCrops = async (req, res) => {
  try {
    // Query parameters
    const { sort, location, category } = req.query;
    
    // Build query
    let cropsQuery = db.collection('crops');
    
    // Filter by location if provided
    if (location) {
      // In Firestore, we need a different approach as there's no regex
      // This is a simple "starts with" query
      cropsQuery = cropsQuery
        .where('location', '>=', location)
        .where('location', '<=', location + '\uf8ff');
    }
    
    // Filter by category if provided (assuming we have category field)
    if (category && category !== 'all') {
      cropsQuery = cropsQuery.where('category', '==', category);
    }
    
    // Execute query
    const cropsSnapshot = await cropsQuery.get();
    
    // Convert to array
    let crops = [];
    cropsSnapshot.forEach((doc) => {
      crops.push({
        ...doc.data(),
        id: doc.id
      });
    });
    
    // Sort results
    if (sort) {
      const sortFields = sort.split(',');
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          // Descending order
          const actualField = field.substring(1);
          crops.sort((a, b) => {
            if (typeof a[actualField] === 'string') {
              return b[actualField].localeCompare(a[actualField]);
            }
            return b[actualField] - a[actualField];
          });
        } else {
          // Ascending order
          crops.sort((a, b) => {
            if (typeof a[field] === 'string') {
              return a[field].localeCompare(b[field]);
            }
            return a[field] - b[field];
          });
        }
      });
    } else {
      // Default sort by newest
      crops.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          if (a.createdAt.toMillis && b.createdAt.toMillis) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });
    }

    res.status(200).json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch crops',
      error: error.message
    });
  }
};

// @desc    Get single crop
// @route   GET /api/crops/:id
// @access  Public
exports.getCrop = async (req, res) => {
  try {
    const cropDoc = await db.collection('crops').doc(req.params.id).get();

    if (!cropDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...cropDoc.data(),
        id: cropDoc.id
      }
    });
  } catch (error) {
    console.error('Get crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch crop',
      error: error.message
    });
  }
};

// @desc    Update crop
// @route   PUT /api/crops/:id
// @access  Private (Seller only)
exports.updateCrop = async (req, res) => {
  try {
    upload.single('cropImage')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }
      
      try {
        const cropDoc = await db.collection('crops').doc(req.params.id).get();

        if (!cropDoc.exists) {
          return res.status(404).json({
            success: false,
            message: 'Crop not found'
          });
        }

        const cropData = cropDoc.data();

        // Make sure user is the crop seller
        if (cropData.sellerId !== req.user.uid) {
          return res.status(401).json({
            success: false,
            message: 'Not authorized to update this crop'
          });
        }

        // Upload new image if provided
        let imageUrl = cropData.cropImage;
        if (req.file) {
          // Delete old image if it's not the default
          if (cropData.cropImage && cropData.cropImage !== 'default-crop.png') {
            // Extract filename from URL
            const fileName = cropData.cropImage.split('/').pop();
            try {
              await storage.file(`crops/${fileName}`).delete();
            } catch (error) {
              console.warn('Could not delete old image:', error);
            }
          }
          
          // Upload new image
          imageUrl = await uploadFileToFirebase(req.file);
        }

        // Prepare update data
        const { name, description, price, quantity, unit, location, harvestDate } = req.body;
        
        const updateData = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (price) updateData.price = parseFloat(price);
        if (quantity) updateData.quantity = parseInt(quantity);
        if (unit) updateData.unit = unit;
        if (location) updateData.location = location;
        if (harvestDate) updateData.harvestDate = harvestDate;
        if (imageUrl) updateData.cropImage = imageUrl;
        
        // Update crop
        await db.collection('crops').doc(req.params.id).update(updateData);

        // Get updated crop
        const updatedCropDoc = await db.collection('crops').doc(req.params.id).get();

        res.status(200).json({
          success: true,
          data: {
            ...updatedCropDoc.data(),
            id: req.params.id
          }
        });
      } catch (error) {
        console.error('Update crop error:', error);
        res.status(500).json({
          success: false,
          message: 'Could not update crop',
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error('Update crop outer error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process request',
      error: error.message
    });
  }
};

// @desc    Delete crop
// @route   DELETE /api/crops/:id
// @access  Private (Seller only)
exports.deleteCrop = async (req, res) => {
  try {
    const cropDoc = await db.collection('crops').doc(req.params.id).get();

    if (!cropDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const cropData = cropDoc.data();

    // Make sure user is the crop seller
    if (cropData.sellerId !== req.user.uid) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this crop'
      });
    }

    // Delete image if it's not the default
    if (cropData.cropImage && cropData.cropImage !== 'default-crop.png') {
      // Extract filename from URL
      const fileName = cropData.cropImage.split('/').pop();
      try {
        await storage.file(`crops/${fileName}`).delete();
      } catch (error) {
        console.warn('Could not delete image:', error);
      }
    }

    // Delete crop document
    await db.collection('crops').doc(req.params.id).delete();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete crop',
      error: error.message
    });
  }
};

// @desc    Get seller crops
// @route   GET /api/crops/seller
// @access  Private (Seller only)
exports.getSellerCrops = async (req, res) => {
  try {
    const cropsSnapshot = await db.collection('crops')
                               .where('sellerId', '==', req.user.uid)
                               .get();
    
    let crops = [];
    cropsSnapshot.forEach(doc => {
      crops.push({
        ...doc.data(),
        id: doc.id
      });
    });

    res.status(200).json({
      success: true,
      count: crops.length,
      data: crops
    });
  } catch (error) {
    console.error('Get seller crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch seller crops',
      error: error.message
    });
  }
};