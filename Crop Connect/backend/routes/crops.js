const express = require('express');
const {
  addCrop,
  getCrops,
  getCrop,
  updateCrop,
  deleteCrop,
  getSellerCrops
} = require('../controllers/cropController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getCrops);
router.get('/:id', getCrop);

// Protected routes - Seller only
router.post('/', protect, authorize('seller'), addCrop);
router.put('/:id', protect, authorize('seller'), updateCrop);
router.delete('/:id', protect, authorize('seller'), deleteCrop);
router.get('/seller/my-crops', protect, authorize('seller'), getSellerCrops);

module.exports = router;