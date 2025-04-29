const Crop = require('../models/Crop');
const User = require('../models/User');

// @desc    Add a new crop
// @route   POST /api/crops
// @access  Private (Sellers only)
exports.addCrop = async (req, res) => {
  try {
    // Add seller ID and name to the request body
    req.body.sellerId = req.user.id;
    req.body.sellerName = req.user.name;
    
    // Check if seller exists
    const seller = await User.findById(req.user.id);
    if (!seller || seller.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can add crops'
      });
    }

    // Create the crop
    const crop = await Crop.create(req.body);

    res.status(201).json({
      success: true,
      data: crop
    });
  } catch (error) {
    console.error('Add crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not add crop',
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
    const { sort, location } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by location if provided
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Execute query
    let crops = Crop.find(query);
    
    // Sort results
    if (sort) {
      const sortFields = sort.split(',').join(' ');
      crops = crops.sort(sortFields);
    } else {
      crops = crops.sort('-createdAt'); // Default sort by newest
    }

    // Execute query
    const results = await crops;

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
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
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    res.status(200).json({
      success: true,
      data: crop
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
    let crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Make sure user is the crop seller
    if (crop.sellerId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this crop'
      });
    }

    // Update crop
    crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: crop
    });
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update crop',
      error: error.message
    });
  }
};

// @desc    Delete crop
// @route   DELETE /api/crops/:id
// @access  Private (Seller only)
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Make sure user is the crop seller
    if (crop.sellerId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this crop'
      });
    }

    await Crop.findByIdAndDelete(req.params.id);

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
    const crops = await Crop.find({ sellerId: req.user.id });

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