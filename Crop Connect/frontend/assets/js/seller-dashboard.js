import { getSellerCrops, addCrop, updateCrop, deleteCrop } from './crops.js';
import { getSellerOrders, updateOrderStatus } from './orders.js';
import { getCurrentUser } from './auth.js';

// Initialize dashboard
export async function initSellerDashboard() {
  try {
    // Protect route
    const user = getCurrentUser();
    if (!user || user.role !== 'seller') {
      window.location.href = 'login.html';
      return;
    }
    
    // Set welcome message
    document.getElementById('farmer-name').textContent = user.name;
    
    // Load data
    await loadSellerStats();
    await loadSellerCrops();
    await loadSellerOrders();
    
    // Set up event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showErrorMessage('Failed to load dashboard data. Please refresh the page.');
  }
}

// Load seller statistics
async function loadSellerStats() {
  try {
    // Get crops count
    const cropsResponse = await getSellerCrops();
    const activeCropsCount = cropsResponse.count;
    document.getElementById('active-crops-count').textContent = activeCropsCount;
    
    // Get orders
    const ordersResponse = await getSellerOrders();
    const orders = ordersResponse.data;
    
    // Count pending orders
    const pendingOrders = orders.filter(order => order.status === 'pending');
    document.getElementById('pending-orders-count').textContent = pendingOrders.length;
    
    // Calculate total revenue
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalPrice, 0);
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
    
  } catch (error) {
    console.error('Load stats error:', error);
    throw error;
  }
}

// Load seller crops
async function loadSellerCrops() {
  try {
    const response = await getSellerCrops();
    const crops = response.data;
    
    const cropsContainer = document.getElementById('my-crops-list');
    cropsContainer.innerHTML = '';
    
    if (crops.length === 0) {
      cropsContainer.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>You haven't added any crops yet.
          </div>
          <button type="button" class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#addCropModal">
            <i class="fas fa-plus me-2"></i>Add Your First Crop
          </button>
        </div>
      `;
      return;
    }
    
    // Display crops
    crops.forEach(crop => {
      const cropElement = document.createElement('div');
      cropElement.className = 'col-md-6 col-lg-4 mb-4';
      cropElement.innerHTML = `
        <div class="card h-100 crop-card">
          <img src="${crop.cropImage || '../assets/img/default-crop.png'}" class="card-img-top" alt="${crop.name}" style="height: 180px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${crop.name}</h5>
            <p class="card-text">${crop.description.substring(0, 100)}${crop.description.length > 100 ? '...' : ''}</p>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-success fw-bold">${formatCurrency(crop.price)}/${crop.unit}</span>
              <span class="badge bg-primary">${crop.quantity} ${crop.unit} available</span>
            </div>
            <p class="card-text"><small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i> ${crop.location}</small></p>
          </div>
          <div class="card-footer d-flex justify-content-between">
            <small class="text-muted">Added on ${formatDate(crop.createdAt)}</small>
            <div>
              <button class="btn btn-sm btn-outline-primary edit-crop-btn" data-crop-id="${crop.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger delete-crop-btn" data-crop-id="${crop.id}">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      
      cropsContainer.appendChild(cropElement);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-crop-btn').forEach(button => {
      button.addEventListener('click', () => {
        const cropId = button.getAttribute('data-crop-id');
        openEditCropModal(cropId);
      });
    });
    
    document.querySelectorAll('.delete-crop-btn').forEach(button => {
      button.addEventListener('click', () => {
        const cropId = button.getAttribute('data-crop-id');
        if (confirm('Are you sure you want to delete this crop?')) {
          handleDeleteCrop(cropId);
        }
      });
    });
    
  } catch (error) {
    console.error('Load crops error:', error);
    document.getElementById('my-crops-list').innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>Error loading crops: ${error.message}
        </div>
      </div>
    `;
  }
}

// Load seller orders
async function loadSellerOrders() {
  try {
    const response = await getSellerOrders();
    const orders = response.data;
    
    const ordersTableBody = document.getElementById('orders-table-body');
    ordersTableBody.innerHTML = '';
    
    if (orders.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">
            No orders found
          </td>
        </tr>
      `;
      return;
    }
    
    // Display orders
    orders.forEach(order => {
      const orderDate = formatDate(order.createdAt);
      const statusBadgeClass = getStatusBadgeClass(order.status);
      
      const row = document.createElement('tr');
      row.setAttribute('data-order-id', order.id);
      row.setAttribute('data-order-status', order.status);
      
      row.innerHTML = `
        <td>${order.id.substring(0, 8)}...</td>
        <td>${order.customerName}</td>
        <td>${order.cropName}</td>
        <td>${order.quantity} ${order.unit}</td>
        <td>${formatCurrency(order.totalPrice)}</td>
        <td><span class="badge ${statusBadgeClass}">${capitalizeFirstLetter(order.status)}</span></td>
        <td>${orderDate}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary update-order-btn" data-order-id="${order.id}" data-order-status="${order.status}">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      
      ordersTableBody.appendChild(row);
    });
    
    // Add event listeners to update order buttons
    document.querySelectorAll('.update-order-btn').forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.getAttribute('data-order-id');
        const currentStatus = button.getAttribute('data-order-status');
        openUpdateOrderModal(orderId, currentStatus);
      });
    });
    
  } catch (error) {
    console.error('Load orders error:', error);
    document.getElementById('orders-table-body').innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4">
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>Error loading orders: ${error.message}
          </div>
        </td>
      </tr>
    `;
  }
}