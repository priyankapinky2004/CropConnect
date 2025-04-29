// API Base URL - Change this to your backend server URL when deploying
const API_URL = 'http://localhost:5000/api';

/**
 * Register a new user
 * @param {Object} userData - User data including name, email, password, role, phone, location
 * @param {string} errorElementId - ID of the element to display errors
 */
async function register(userData, errorElementId) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Display error message
      const errorElement = document.getElementById(errorElementId);
      errorElement.textContent = data.message || 'Registration failed';
      errorElement.classList.remove('d-none');
      return;
    }
    
    // Store token and user data in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to appropriate dashboard
    if (userData.role === 'seller') {
      window.location.href = 'seller-dashboard.html';
    } else {
      window.location.href = 'customer-dashboard.html';
    }
  } catch (error) {
    console.error('Registration error:', error);
    const errorElement = document.getElementById(errorElementId);
    errorElement.textContent = 'Network error. Please try again.';
    errorElement.classList.remove('d-none');
  }
}

/**
 * Login user
 * @param {Object} userData - User credentials (email, password)
 */
async function login(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Display error message
      const errorElement = document.getElementById('login-error');
      errorElement.textContent = data.message || 'Invalid credentials';
      errorElement.classList.remove('d-none');
      return;
    }
    
    // Store token and user data in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to appropriate dashboard
    if (data.user.role === 'seller') {
      window.location.href = 'seller-dashboard.html';
    } else {
      window.location.href = 'customer-dashboard.html';
    }
  } catch (error) {
    console.error('Login error:', error);
    const errorElement = document.getElementById('login-error');
    errorElement.textContent = 'Network error. Please try again.';
    errorElement.classList.remove('d-none');
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated, false otherwise
 */
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}

/**
 * Get current user data
 * @returns {Object|null} - User object if logged in, null otherwise
 */
function getCurrentUser() {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Get authentication token
 * @returns {string|null} - JWT token if logged in, null otherwise
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

/**
 * Update user profile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} - Updated user data
 */
async function updateProfile(profileData) {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/auth/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Could not update profile');
    }
    
    // Update stored user data
    const currentUser = getCurrentUser();
    const updatedUser = { ...currentUser, ...data.data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return data.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

/**
 * Fetch current user's profile from the server
 * @returns {Promise<Object>} - User profile data
 */
async function fetchUserProfile() {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Could not fetch profile');
    }
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(data.data));
    
    return data.data;
  } catch (error) {
    console.error('Fetch profile error:', error);
    throw error;
  }
}

// Protect routes - Redirect if not authenticated
function protectRoute() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Check user role
function checkRole(allowedRoles) {
  const user = getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// Export functions
window.register = register;
window.login = login;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.getToken = getToken;
window.logout = logout;
window.updateProfile = updateProfile;
window.fetchUserProfile = fetchUserProfile;
window.protectRoute = protectRoute;
window.checkRole = checkRole;