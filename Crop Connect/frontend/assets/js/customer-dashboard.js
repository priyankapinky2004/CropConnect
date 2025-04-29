import { getCustomerOrders, cancelOrder } from './orders.js';
import { getCurrentUser } from './auth.js';
import { getAllCrops } from './crops.js';

// Initialize dashboard
export async function initCustomerDashboard() {
  try {
    // Protect route
    const user = getCurrentUser();
    if (!user || user.role !== 'customer') {
      window.location.href = 'login.html';
      return;
    }
    
    // Set welcome message
    document.getElementById('customer-name').textContent = user.name;
    
    // Load data
    await loadCustomerStats();
    await loadCustomerOrders();
    
    // Set up event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showErrorMessage('Failed to load dashboard data. Please refresh the page.');
  }
}

// Load customer statistics
async function loadCustomerStats() {
  try {
    // Get orders
    const ordersResponse = await getCustomerOrders();
    const orders = ordersResponse.data;
    
    // Update stats
    document.getElementById('total-orders-count').textContent = orders.length;
    
    const pendingDelivery = orders.filter(order => 
      ['confirmed', 'shipped'].includes(order.status)
    ).length;
    document.getElementById('pending-delivery-count').textContent = pendingDelivery;
    
    const totalSpent = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalPrice, 0);
    document.getElementById('total-spent').textContent = formatCurrency(totalSpent);
    
  } catch (error) {
    console.error('Load stats error:', error);
    throw error;
  }
}

// Load customer orders
async function loadCustomerOrders() {
  try {
    const response = await getCustomerOrders();
    const orders = response.data;
    
    const ordersTableBody = document.getElementById('orders-table-body');
    ordersTableBody.innerHTML = '';
    
    if (orders.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4">
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i>You haven't placed any orders yet.
            </div>
            <a href="browse-crops.html" class="btn btn-primary mt-3">
              <i class="fas fa-shopping-basket me-2"></i>Browse Crops Now
            </a>
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
        <td>${order.cropName}</td>
        <td>${order.quantity} ${order.unit}</td>
        <td>${formatCurrency(order.totalPrice)}</td>
        <td>${order.sellerName}</td>
        <td><span class="badge ${statusBadgeClass}">${capitalizeFirstLetter(order.status)}</span></td>
        <td>${orderDate}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary view-order-btn" data-order-id="${order.id}">
            <i class="fas fa-eye"></i>
          </button>
          ${order.status === 'pending' ? `
            <button class="btn btn-sm btn-outline-danger cancel-btn" data-order-id="${order.id}">
              <i class="fas fa-times"></i>
            </button>
          ` : ''}
        </td>
      `;
      
      ordersTableBody.appendChild(row);
    });
    
    // Add event listeners
    document.querySelectorAll('.view-order-btn').forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.getAttribute('data-order-id');
        viewOrderDetails(orderId);
      });
    });
    
    document.querySelectorAll('.cancel-btn').forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.getAttribute('data-order-id');
        if (confirm('Are you sure you want to cancel this order?')) {
          handleCancelOrder(orderId);
        }
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

// ===============================
// HELPER FUNCTIONS
// ===============================

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  // If it's a Firebase timestamp
  if (timestamp.toDate) {
    timestamp = timestamp.toDate();
  }
  // If it's an ISO string
  else if (typeof timestamp === 'string') {
    timestamp = new Date(timestamp);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(timestamp);
}

// Get status badge class
function getStatusBadgeClass(status) {
  switch (status) {
    case 'pending':
      return 'bg-warning';
    case 'confirmed':
      return 'bg-primary';
    case 'shipped':
      return 'bg-info';
    case 'delivered':
      return 'bg-success';
    case 'cancelled':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Show error message
function showErrorMessage(message) {
  const alertContainer = document.createElement('div');
  alertContainer.className = 'alert alert-danger alert-dismissible fade show';
  alertContainer.setAttribute('role', 'alert');
  alertContainer.innerHTML = `
    <i class="fas fa-exclamation-circle me-2"></i>${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add to page
  document.querySelector('.container').prepend(alertContainer);
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    const alert = document.querySelector('.alert');
    if (alert) {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    }
  }, 5000);
} 