import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  runTransaction 
} from "firebase/firestore";
import { getCurrentUser } from './auth.js';

// Place a new order
export async function placeOrder(orderData) {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    if (user.role !== 'customer') {
      throw new Error('Only customers can place orders');
    }
    
    const cropDoc = await getDoc(doc(db, "crops", orderData.cropId));
    
    if (!cropDoc.exists()) {
      throw new Error('Crop not found');
    }
    
    const crop = cropDoc.data();
    
    // Check if quantity is available
    if (crop.quantity < orderData.quantity) {
      throw new Error(`Only ${crop.quantity} ${crop.unit} available`);
    }
    
    // Calculate total price
    const totalPrice = crop.price * orderData.quantity;
    
    // Use Firebase transaction to ensure consistency
    const cropRef = doc(db, "crops", orderData.cropId);
    
    // The new order reference we'll create
    let newOrderRef;
    let newOrderData;
    
    await runTransaction(db, async (transaction) => {
      // Get fresh crop data within transaction
      const cropSnapshot = await transaction.get(cropRef);
      
      if (!cropSnapshot.exists()) {
        throw new Error('Crop not found');
      }
      
      const freshCrop = cropSnapshot.data();
      
      // Check quantity again
      if (freshCrop.quantity < orderData.quantity) {
        throw new Error(`Only ${freshCrop.quantity} ${freshCrop.unit} available`);
      }
      
      // Update crop quantity
      transaction.update(cropRef, {
        quantity: freshCrop.quantity - orderData.quantity
      });
      
      // Create new order
      newOrderRef = doc(collection(db, "orders"));
      
      newOrderData = {
        id: newOrderRef.id,
        cropId: orderData.cropId,
        cropName: crop.name,
        customerId: user.id,
        customerName: user.name,
        sellerId: crop.sellerId,
        sellerName: crop.sellerName,
        quantity: parseInt(orderData.quantity),
        unit: crop.unit,
        price: crop.price,
        totalPrice: parseFloat(totalPrice),
        deliveryAddress: orderData.deliveryAddress,
        contactPhone: orderData.contactPhone,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      transaction.set(newOrderRef, newOrderData);
    });
    
    return {
      success: true,
      data: newOrderData
    };
  } catch (error) {
    console.error('Place order error:', error);
    throw error;
  }
}

// Get customer orders
export async function getCustomerOrders() {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    if (user.role !== 'customer') {
      throw new Error('Not authorized');
    }
    
    const ordersQuery = query(
      collection(db, "orders"),
      where("customerId", "==", user.id),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    let orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        ...doc.data(),
        id: doc.id
      });
    });
    
    return {
      success: true,
      count: orders.length,
      data: orders
    };
  } catch (error) {
    console.error('Get customer orders error:', error);
    throw error;
  }
}

// Get seller orders
export async function getSellerOrders() {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    if (user.role !== 'seller') {
      throw new Error('Not authorized');
    }
    
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", user.id),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    
    let orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        ...doc.data(),
        id: doc.id
      });
    });
    
    return {
      success: true,
      count: orders.length,
      data: orders
    };
  } catch (error) {
    console.error('Get seller orders error:', error);
    throw error;
  }
}

// Update order status (for sellers)
export async function updateOrderStatus(orderId, status) {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    if (user.role !== 'seller') {
      throw new Error('Only sellers can update order status');
    }
    
    // Check if status is valid
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      throw new Error('Invalid status');
    }
    
    // Get order data
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderDoc.data();
    
    // Check ownership
    if (orderData.sellerId !== user.id) {
      throw new Error('Not authorized to update this order');
    }
    
    // Handle cancellation - return quantity to crop
    if (status === 'cancelled' && orderData.status !== 'cancelled') {
      const cropRef = doc(db, "crops", orderData.cropId);
      
      await runTransaction(db, async (transaction) => {
        const cropDoc = await transaction.get(cropRef);
        
        if (cropDoc.exists()) {
          const currentQuantity = cropDoc.data().quantity;
          
          transaction.update(cropRef, {
            quantity: currentQuantity + orderData.quantity
          });
          
          transaction.update(doc(db, "orders", orderId), {
            status,
            updatedAt: serverTimestamp()
          });
        } else {
          // Just update the order if crop is no longer available
          transaction.update(doc(db, "orders", orderId), {
            status,
            updatedAt: serverTimestamp()
          });
        }
      });
    } else {
      // Regular status update
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: serverTimestamp()
      });
    }
    
    // Get updated order
    const updatedOrderDoc = await getDoc(doc(db, "orders", orderId));
    
    return {
      success: true,
      data: {
        ...updatedOrderDoc.data(),
        id: orderId
      }
    };
  } catch (error) {
    console.error('Update order status error:', error);
    throw error;
  }
}

// Cancel order (for customers)
export async function cancelOrder(orderId) {
  try {
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    if (user.role !== 'customer') {
      throw new Error('Only customers can cancel orders');
    }
    
    // Get order data
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderDoc.data();
    
    // Check ownership
    if (orderData.customerId !== user.id) {
      throw new Error('Not authorized to cancel this order');
    }
    
    // Check if order is cancellable
    if (orderData.status !== 'pending') {
      throw new Error(`Cannot cancel order in '${orderData.status}' status`);
    }
    
    // Use transaction to restore crop quantity
    const cropRef = doc(db, "crops", orderData.cropId);
    const orderRef = doc(db, "orders", orderId);
    
    await runTransaction(db, async (transaction) => {
      const cropDoc = await transaction.get(cropRef);
      
      // Update order status
      transaction.update(orderRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      
      // Restore crop quantity if crop still exists
      if (cropDoc.exists()) {
        const currentQuantity = cropDoc.data().quantity;
        
        transaction.update(cropRef, {
          quantity: currentQuantity + orderData.quantity
        });
      }
    });
    
    // Get updated order
    const updatedOrderDoc = await getDoc(orderRef);
    
    return {
      success: true,
      data: {
        ...updatedOrderDoc.data(),
        id: orderId
      }
    };
  } catch (error) {
    console.error('Cancel order error:', error);
    throw error;
  }
}
