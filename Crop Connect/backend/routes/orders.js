const express = require('express');
const {
  placeOrder,
  getCustomerOrders,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Customer routes
router.post('/', protect, authorize('customer'), placeOrder);
router.get('/customer', protect, authorize('customer'), getCustomerOrders);
router.put('/:id/cancel', protect, authorize('customer'), cancelOrder);

// Seller routes
router.get('/seller', protect, authorize('seller'), getSellerOrders);
router.put('/:id', protect, authorize('seller'), updateOrderStatus);

module.exports = router;