const Order = require('../models/Order');
const Crop = require('../models/Crop');
const User = require('../models/User');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customers only)
exports.placeOrder = async (req, res) => {
  try {
    const { cropId, quantity, deliveryAddress, contactPhone } = req.body;

    // Check if customer exists
    const customer = await User.findById(req.user.id);
    if (!customer || customer.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can place orders'
      });
    }

    // Check if crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Check if quantity is available
    if (crop.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${crop.quantity} ${crop.unit} available`
      });
    }

    // Calculate total price
    const totalPrice = crop.price * quantity;

    // Create order
    const order = await Order.create({
      cropId,
      cropName: crop.name,
      customerId: req.user.id,
      customerName: customer.name,
      sellerId: crop.sellerId,
      quantity,
      unit: crop.unit,
      totalPrice,
      deliveryAddress,
      contactPhone
    });

    // Update crop quantity
    crop.quantity -= quantity;
    await crop.save();

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not place order',
      error: error.message
    });
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/customer
// @access  Private (Customers only)
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch customer orders',
      error: error.message
    });
  }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller
// @access  Private (Sellers only)
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user.id });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch seller orders',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private (Sellers only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Check if status is valid
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Find order
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if user is the seller
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }
    
    // Update order
    order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update order status',
      error: error.message
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customers only)
exports.cancelOrder = async (req, res) => {
  try {
    // Find order
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if user is the customer
    if (order.customerId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }
    
    // Check if order is cancellable (only pending orders can be cancelled)
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in '${order.status}' status`
      });
    }
    
    // Cancel order
    order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    
    // Restore crop quantity
    const crop = await Crop.findById(order.cropId);
    if (crop) {
      crop.quantity += order.quantity;
      await crop.save();
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not cancel order',
      error: error.message
    });
  }
};