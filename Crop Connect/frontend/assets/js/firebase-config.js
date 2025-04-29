// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  onSnapshot,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Check current auth state
function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
}

// Get user from localStorage (for simple auth)
function getUserFromStorage() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error("Error parsing user data from localStorage:", e);
    return null;
  }
}

// Check if user is authorized to access a page
function checkAuth(allowedRoles = ['seller', 'customer']) {
  const user = getUserFromStorage();
  
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  
  if (!allowedRoles.includes(user.role)) {
    alert("You don't have permission to access this page");
    window.location.href = user.role === 'seller' ? 'seller-dashboard.html' : 'customer-dashboard.html';
    return null;
  }
  
  return user;
}

// Logout function
function logout() {
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// PRODUCT MANAGEMENT FUNCTIONS

// Add a new product
async function addProduct(productData, imageFile) {
  try {
    const user = getUserFromStorage();
    if (!user) throw new Error("User not authenticated");
    
    let imageUrl = null;
    
    // Upload image if provided
    if (imageFile) {
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }
    
    // Create product document
    const productRef = await addDoc(collection(db, "products"), {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      category: productData.category,
      imageUrl: imageUrl,
      sellerId: user.id,
      sellerName: user.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return productRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

// Get all products by seller ID
async function getProductsBySeller(sellerId) {
  try {
    const q = query(collection(db, "products"), where("sellerId", "==", sellerId));
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting seller products:", error);
    throw error;
  }
}

// Get all products (for customers)
async function getAllProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting all products:", error);
    throw error;
  }
}

// Get a single product by ID
async function getProductById(productId) {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error("Error getting product:", error);
    throw error;
  }
}

// Update a product
async function updateProduct(productId, productData, imageFile) {
  try {
    const user = getUserFromStorage();
    if (!user) throw new Error("User not authenticated");
    
    // Get the current product to check permissions
    const currentProduct = await getProductById(productId);
    if (currentProduct.sellerId !== user.id) {
      throw new Error("You don't have permission to update this product");
    }
    
    let imageUrl = currentProduct.imageUrl;
    
    // Upload new image if provided
    if (imageFile) {
      // Delete old image if exists
      if (imageUrl) {
        try {
          const oldImageRef = ref(storage, imageUrl);
          await deleteObject(oldImageRef);
        } catch (err) {
          console.warn("Error deleting old image:", err);
        }
      }
      
      // Upload new image
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }
    
    // Update product document
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      category: productData.category,
      imageUrl: imageUrl,
      updatedAt: serverTimestamp()
    });
    
    return productId;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

// Delete a product
async function deleteProduct(productId) {
  try {
    const user = getUserFromStorage();
    if (!user) throw new Error("User not authenticated");
    
    // Get the current product to check permissions
    const currentProduct = await getProductById(productId);
    if (currentProduct.sellerId !== user.id) {
      throw new Error("You don't have permission to delete this product");
    }
    
    // Delete image if exists
    if (currentProduct.imageUrl) {
      try {
        const imageRef = ref(storage, currentProduct.imageUrl);
        await deleteObject(imageRef);
      } catch (err) {
        console.warn("Error deleting image:", err);
      }
    }
    
    // Delete product document
    await deleteDoc(doc(db, "products", productId));
    
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

// CART MANAGEMENT FUNCTIONS

// Get user's cart
async function getCart() {
  try {
    const user = getUserFromStorage();
    if (!user) throw new Error("User not authenticated");
    
    // Get or create cart document
    const cartRef = doc(db, "carts", user.id);
    const cartDoc = await getDoc(cartRef);
    
    if (cartDoc.exists()) {
      const cartData = cartDoc.data();
      return {
        id: cartDoc.id,
        items: cartData.items || [],
        totalItems: cartData.totalItems || 0,
        totalPrice: cartData.totalPrice || 0
      };
    } else {
      // Create empty cart if not exists
      await updateDoc(cartRef, {
        userId: user.id,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        updatedAt: serverTimestamp()
      });
      
      return {
        id: user.id,
        items: [],
        totalItems: 0,
        totalPrice: 0
      };
    }
  } catch (error) {
    console.error("Error getting cart:", error);
    throw error;
  }
}

// Add item to cart
async function addToCart(productId, quantity = 1) {
  try {
    const user = getUserFromStorage();
    if (!user) throw new Error("User not authenticated");
    
    // Get product details
    const product = await getProductById(productId);
    
    // Get current cart
    const cartRef = doc(db, "carts", user.id);
    const cartDoc = await getDoc(cartRef);
    
    let cart;
    let items = [];
    let totalItems = 0;
    let totalPrice = 0;
    
    if (cartDoc.exists()) {
      cart = cartDoc.data();
      items = cart.items || [];
      totalItems = cart.totalItems || 0;
      totalPrice = cart.totalPrice || 0;
    }
    
    // Check if product already in cart
    const existingItemIndex = items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      items[existingItemIndex].quantity += quantity;
      totalItems += quantity;
      totalPrice += product.price * quantity;
    } else {
      // Add new item to cart
      items.push({
        productId: productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantity
      });
      totalItems += quantity;
      totalPrice += product.price * quantity;
    }
    
    // Update cart in Firestore
    await updateDoc(cartRef, {
      userId: user.id,
      items: items,
      totalItems: totalItems,
      totalPrice: totalPrice,
      updatedAt: serverTimestamp()
    });
    
    return {
      items,
      totalItems,
      totalPrice
    };
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

// Update cart item quantity
async function updateCartItemQuantity(productId, quantity) {
  try {
    const user = getUserFromStorage();
    if (!user) throw new Error("User not authenticated");
    
    // Get current cart
    const cartRef = doc(db, "carts", user.id);
    const cartDoc = await getDoc(cartRef);
    
    if (!cartDoc.exists()) throw new Error("Cart not found");
    
    const cart = cartDoc.data();
    const items = cart.items || [];
    
    // Find the item in cart
    const itemIndex = items.findIndex(item => item.productId === productId);
    
    if (itemIndex < 0) throw new Error("Product not in cart");
    
    // Calculate new totals
    const oldQuantity = items[itemIndex].quantity;
    const priceDifference = items[itemIndex].price * (quantity - oldQuantity);
    
    // Update item quantity
    items[itemIndex].quantity = quantity;
    
    // Update cart totals
    const totalItems = cart.totalItems - oldQuantity + quantity;
    const totalPrice = cart.totalPrice + priceDifference;
    
    // Update cart in Firestore
    await updateDoc(cartRef, {
      items: items,
      totalItems: totalItems,
      totalPrice: totalPrice,
      updatedAt: serverTimestamp()
    });
    
    return {
      items,
      totalItems,
      totalPrice
    };
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
}

// Remove item from cart
async function removeFromCart(productId) {
  try {
    const user = getUserFromStorage();
    if (!user) throw new Error("User not authenticated");
    
    // Get current cart
    const cartRef = doc(db, "carts", user.id);
    const cartDoc = await getDoc(cartRef);
    
    if (!cartDoc.exists()) throw new Error("Cart not found");
    
    const cart = cartDoc.data();
    const items = cart.items || [];
    
    // Find the item in cart
    const itemIndex = items.findIndex(item => item.productId === productId);
    
    if (itemIndex < 0) throw new Error("Product not in cart");
    
    // Calculate new totals
    const removedQuantity = items[itemIndex].quantity;
    const removedPrice = items[itemIndex].price * removedQuantity;
    
    // Remove item from cart
    items.splice(itemIndex, 1);
    
    // Update cart totals
    const totalItems = cart.totalItems - removedQuantity;
    const totalPrice = cart.totalPrice - removedPrice;
    
    // Update cart in Firestore
    await updateDoc(cartRef, {
      items: items,
      totalItems: totalItems,
      totalPrice: totalPrice,
      updatedAt: serverTimestamp()
    });
    
    return {
      items,
      totalItems,
      totalPrice
    };
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

// Listen for real-time cart updates
function listenToCartUpdates(callback) {
  const user = getUserFromStorage();
  if (!user) return null;
  
  const cartRef = doc(db, "carts", user.id);
  
  return onSnapshot(cartRef, (doc) => {
    if (doc.exists()) {
      const cartData = doc.data();
      callback({
        id: doc.id,
        items: cartData.items || [],
        totalItems: cartData.totalItems || 0,
        totalPrice: cartData.totalPrice || 0
      });
    } else {
      callback({
        id: user.id,
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }
  });
}

// Export all functions
export {
  auth,
  db,
  storage,
  getCurrentUser,
  getUserFromStorage,
  checkAuth,
  logout,
  addProduct,
  getProductsBySeller,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  listenToCartUpdates
};