const { orderDb, orderAdmin } = require('../config/firebase');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Customers only)
exports.placeOrder = async (req, res) => {
  try {
    const { cropId, quantity, deliveryAddress, contactPhone, totalPrice } = req.body;

    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    let orderRef = orderDb.collection('orders').doc();
    let orderData;

    await orderDb.runTransaction(async (transaction) => {
      const cropRef = orderDb.collection('crops').doc(cropId);
      const freshCropDoc = await transaction.get(cropRef);

      if (!freshCropDoc.exists) {
        throw new Error('Crop not found');
      }

      const freshCrop = freshCropDoc.data();

      if (freshCrop.quantity < quantity) {
        throw new Error(`Only ${freshCrop.quantity} ${freshCrop.unit} available`);
      }

      orderData = {
        id: orderRef.id,
        cropId,
        cropName: freshCrop.name,
        customerId: req.user.uid,
        customerName: req.user.name,
        sellerId: freshCrop.sellerId,
        sellerName: freshCrop.sellerName,
        quantity: parseInt(quantity),
        unit: freshCrop.unit,
        price: freshCrop.price,
        totalPrice: parseFloat(totalPrice),
        deliveryAddress,
        contactPhone,
        status: 'pending',
        createdAt: orderAdmin.firestore.FieldValue.serverTimestamp(),
      };

      transaction.update(cropRef, {
        quantity: freshCrop.quantity - parseInt(quantity),
      });

      transaction.set(orderRef, orderData);
    });

    res.status(201).json({
      success: true,
      data: orderData,
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not place order',
      error: error.message,
    });
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/customer
// @access  Private (Customers only)
exports.getCustomerOrders = async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const ordersSnapshot = await orderDb
      .collection('orders')
      .where('customerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch customer orders',
      error: error.message,
    });
  }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller
// @access  Private (Sellers only)
exports.getSellerOrders = async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const ordersSnapshot = await orderDb
      .collection('orders')
      .where('sellerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch seller orders',
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private (Sellers only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const orderDocRef = orderDb.collection('orders').doc(orderId);
    const orderDoc = await orderDocRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const orderData = orderDoc.data();

    if (orderData.sellerId !== req.user.uid) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this order',
      });
    }

    if (status === 'cancelled' && orderData.status !== 'cancelled') {
      await orderDb.runTransaction(async (transaction) => {
        const cropRef = orderDb.collection('crops').doc(orderData.cropId);
        const cropDoc = await transaction.get(cropRef);

        if (cropDoc.exists) {
          const currentQuantity = cropDoc.data().quantity;

          transaction.update(cropRef, {
            quantity: currentQuantity + orderData.quantity,
          });
        }

        transaction.update(orderDocRef, {
          status,
          updatedAt: orderAdmin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } else {
      await orderDocRef.update({
        status,
        updatedAt: orderAdmin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const updatedOrderDoc = await orderDocRef.get();

    res.status(200).json({
      success: true,
      data: {
        ...updatedOrderDoc.data(),
        id: orderId,
      },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update order status',
      error: error.message,
    });
  }
};

// @desc    Cancel order (Customer only)
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customers only)
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderDocRef = orderDb.collection('orders').doc(orderId);
    const orderDoc = await orderDocRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const orderData = orderDoc.data();

    if (orderData.customerId !== req.user.uid) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    if (orderData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in '${orderData.status}' status`,
      });
    }

    await orderDb.runTransaction(async (transaction) => {
      transaction.update(orderDocRef, {
        status: 'cancelled',
        updatedAt: orderAdmin.firestore.FieldValue.serverTimestamp(),
      });

      const cropRef = orderDb.collection('crops').doc(orderData.cropId);
      const cropDoc = await transaction.get(cropRef);

      if (cropDoc.exists) {
        const currentQuantity = cropDoc.data().quantity;
        transaction.update(cropRef, {
          quantity: currentQuantity + parseInt(orderData.quantity),
        });
      }
    });

    const updatedOrderDoc = await orderDocRef.get();

    res.status(200).json({
      success: true,
      data: {
        ...updatedOrderDoc.data(),
        id: orderId,
      },
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not cancel order',
      error: error.message,
    });
  }
};
