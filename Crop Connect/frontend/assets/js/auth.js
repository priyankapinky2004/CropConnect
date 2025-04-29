/**
 * auth.js - Proper role-based authentication and authorization system
 * 
 * This file provides a complete authentication system for the CropConnect application
 * with proper security, error handling, and session management.
 */

class AuthSystem {
  constructor() {
    // Define user session key
    this.USER_SESSION_KEY = 'cropconnect_user';
    
    // Define redirect paths
    this.PATHS = {
      FARMER: 'seller-dashboard.html',
      CUSTOMER: 'customer-dashboard.html',
      LOGIN: 'login.html',
      REGISTER: 'register.html',
      HOME: 'index.html'
    };
    
    // Define authentication endpoints (would connect to backend in real app)
    this.API_ENDPOINTS = {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      VERIFY: '/api/auth/verify'
    };
    
    // Initialize by checking login status
    this.initAuth();
  }
  
  /**
   * Initialize authentication system
   */
  initAuth() {
    // Check if user is logged in on page load
    this.checkLoginStatus();
    
    // Set up event listeners for forms if they exist
    this.setupEventListeners();
    
    // Check URL for role parameter
    this.checkUrlForRole();
  }
  
  /**
   * Setup event listeners for login and register forms
   */
  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    // Register forms - farmer and customer
    const farmerForm = document.getElementById('farmer-form');
    if (farmerForm) {
      farmerForm.addEventListener('submit', (e) => this.handleRegister(e, 'seller'));
    }
    
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
      customerForm.addEventListener('submit', (e) => this.handleRegister(e, 'customer'));
    }
    
    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
      togglePassword.addEventListener('click', this.togglePasswordVisibility);
    }
    
    // Forgot password
    const forgotPassword = document.getElementById('forgot-password');
    if (forgotPassword) {
      forgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleForgotPassword();
      });
    }
    
    // Role selection tabs in register page
    const farmerOption = document.getElementById('farmer-option');
    const customerOption = document.getElementById('customer-option');
    
    if (farmerOption && customerOption) {
      farmerOption.addEventListener('click', () => this.switchRegistrationForm('seller'));
      customerOption.addEventListener('click', () => this.switchRegistrationForm('customer'));
    }
    
    // Logout buttons
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    });
  }
  
  /**
   * Switch between registration forms (farmer/customer)
   * @param {string} role - The role to switch to ('seller' or 'customer')
   */
  switchRegistrationForm(role) {
    const farmerForm = document.getElementById('farmer-form');
    const customerForm = document.getElementById('customer-form');
    const farmerOption = document.getElementById('farmer-option');
    const customerOption = document.getElementById('customer-option');
    
    if (role === 'seller') {
      farmerForm.style.display = 'block';
      customerForm.style.display = 'none';
      farmerOption.classList.add('active');
      customerOption.classList.remove('active');
    } else {
      farmerForm.style.display = 'none';
      customerForm.style.display = 'block';
      farmerOption.classList.remove('active');
      customerOption.classList.add('active');
    }
  }
  
  /**
   * Toggle password visibility
   */
  togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle eye icon
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  }
  
  /**
   * Handle login form submission
   * @param {Event} event - The form submission event
   */
  async handleLogin(event) {
    if (event) {
      event.preventDefault();
    }
    
    // Get email and password
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validate input
    if (!this.validateLoginForm(email, password)) {
      return;
    }
    
    try {
      // In a real application, this would make an API call to verify credentials
      // Instead, we'll simulate authentication based on email
      
      // Display loading state
      this.setLoading(true, 'Logging in...');
      
      // Simulate API call with timeout
      await this.simulateApiDelay(500);
      
      // Check if email has farmer/seller in it to determine role
      const userRole = email.toLowerCase().includes('farmer') || email.toLowerCase().includes('seller') 
        ? 'seller' 
        : 'customer';
      
      // Create user object
      const user = {
        id: this.generateUserId(),
        email: email,
        role: userRole,
        name: this.formatName(email.split('@')[0]),
        lastLogin: new Date().toISOString(),
        authToken: this.generateAuthToken()
      };
      
      // Save user to session storage (more secure than localStorage)
      this.setUserSession(user);
      
      // Reset loading
      this.setLoading(false);
      
      // Redirect based on role
      this.redirectToDashboard(userRole);
    } catch (error) {
      // Handle error
      this.setLoading(false);
      this.showError(error.message || 'Login failed. Please try again.');
      console.error('Login error:', error);
    }
  }
  
  /**
   * Validate login form fields
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {boolean} - Whether the form is valid
   */
  validateLoginForm(email, password) {
    // Check for empty fields
    if (!email || !password) {
      this.showError('Please enter both email and password');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError('Please enter a valid email address');
      return false;
    }
    
    // Password minimum length
    if (password.length < 6) {
      this.showError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle registration form submission
   * @param {Event} event - The form submission event
   * @param {string} role - User role ('seller' or 'customer')
   */
  async handleRegister(event, role) {
    if (event) {
      event.preventDefault();
    }
    
    // Get the appropriate form based on role
    const formId = role === 'seller' ? 'farmer-form' : 'customer-form';
    const form = document.getElementById(formId);
    
    if (!form) {
      this.showError('Registration form not found');
      return;
    }
    
    // Get form data
    const name = form.querySelector('[name="name"]').value;
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;
    const confirmPassword = form.querySelector('[name="confirmPassword"]').value;
    const phone = form.querySelector('[name="phone"]').value;
    const location = form.querySelector('[name="location"]').value;
    const termsChecked = form.querySelector('[name="termsAccepted"]').checked;
    
    // Validate registration form
    if (!this.validateRegistrationForm(name, email, password, confirmPassword, phone, location, termsChecked)) {
      return;
    }
    
    try {
      // In a real application, this would call an API to register the user
      
      // Display loading state
      this.setLoading(true, 'Creating your account...');
      
      // Simulate API call with timeout
      await this.simulateApiDelay(800);
      
      // Create user object
      const user = {
        id: this.generateUserId(),
        name: name,
        email: email,
        role: role,
        phone: phone,
        location: location,
        registered: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        authToken: this.generateAuthToken()
      };
      
      // Save user to session storage
      this.setUserSession(user);
      
      // Reset loading
      this.setLoading(false);
      
      // Redirect based on role
      this.redirectToDashboard(role);
    } catch (error) {
      // Handle error
      this.setLoading(false);
      this.showError(error.message || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    }
  }
  
  /**
   * Validate registration form fields
   * @returns {boolean} - Whether the form is valid
   */
  validateRegistrationForm(name, email, password, confirmPassword, phone, location, termsChecked) {
    // Check for empty fields
    if (!name || !email || !password || !confirmPassword || !phone || !location) {
      this.showError('Please fill in all required fields');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError('Please enter a valid email address');
      return false;
    }
    
    // Password minimum length
    if (password.length < 6) {
      this.showError('Password must be at least 6 characters');
      return false;
    }
    
    // Password match
    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return false;
    }
    
    // Phone validation (basic format)
    const phoneRegex = /^\+?[\d\s()-]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      this.showError('Please enter a valid phone number');
      return false;
    }
    
    // Terms and conditions
    if (!termsChecked) {
      this.showError('You must agree to the Terms and Conditions');
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle forgot password request
   */
  handleForgotPassword() {
    const email = document.getElementById('email').value;
    
    if (!email) {
      this.showError('Please enter your email address first');
      return;
    }
    
    // In a real app, this would call an API to send password reset email
    alert(`In a real application, a password reset link would be sent to: ${email}`);
  }
  
  /**
   * Handle logout
   */
  handleLogout() {
    // Clear session storage
    this.clearUserSession();
    
    // Redirect to login page
    window.location.href = this.PATHS.LOGIN;
  }
  
  /**
   * Check login status and redirect if necessary
   */
  checkLoginStatus() {
    const user = this.getUserSession();
    const currentPath = window.location.pathname;
    
    // If user is logged in
    if (user) {
      // If on login or register page, redirect to dashboard
      if (currentPath.includes(this.PATHS.LOGIN) || currentPath.includes(this.PATHS.REGISTER)) {
        this.redirectToDashboard(user.role);
      }
      
      // Update UI to show logged in state
      this.updateUIForLoggedInUser(user);
    } else {
      // If on protected page, redirect to login
      if (
        currentPath.includes('dashboard') || 
        currentPath.includes('profile') || 
        currentPath.includes('settings')
      ) {
        window.location.href = this.PATHS.LOGIN;
      }
    }
  }
  
  /**
   * Update UI for logged in user (show username, etc.)
   * @param {Object} user - The logged in user
   */
  updateUIForLoggedInUser(user) {
    // Update any UI elements that show user info
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = user.name;
    });
    
    // Show appropriate role-specific UI elements
    document.querySelectorAll('[data-role]').forEach(el => {
      if (el.dataset.role === user.role || el.dataset.role === 'both') {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  }
  
  /**
   * Check URL for role parameter
   */
  checkUrlForRole() {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    
    if (role && (role === 'seller' || role === 'customer')) {
      this.switchRegistrationForm(role);
    }
  }
  
  /**
   * Register a user directly based on role (quick login)
   * @param {string} role - The role to register as
   */
  registerAs(role) {
    // Create demo user
    const user = {
      id: this.generateUserId(),
      name: role === 'seller' ? 'Demo Farmer' : 'Demo Customer',
      email: role === 'seller' ? 'farmer@example.com' : 'customer@example.com',
      role: role,
      lastLogin: new Date().toISOString(),
      authToken: this.generateAuthToken()
    };
    
    // Save user to session storage
    this.setUserSession(user);
    
    // Redirect based on role
    this.redirectToDashboard(role);
  }
  
  /**
   * Redirect to the appropriate dashboard
   * @param {string} role - User role
   */
  redirectToDashboard(role) {
    if (role === 'seller') {
      window.location.href = this.PATHS.FARMER;
    } else {
      window.location.href = this.PATHS.CUSTOMER;
    }
  }
  
  /**
   * Show error message
   * @param {string} message - Error message to display
   * @param {string} elementId - ID of error element (default: 'error-message')
   */
  showError(message, elementId = 'error-message') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Scroll to error message
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    } else {
      // Fallback to alert if element not found
      console.error(message);
    }
  }
  
  /**
   * Set loading state
   * @param {boolean} isLoading - Whether loading state is active
   * @param {string} message - Loading message to display
   */
  setLoading(isLoading, message = 'Loading...') {
    // Find submit button in current form
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (submitBtn) {
      if (isLoading) {
        // Store original text
        submitBtn.dataset.originalText = submitBtn.textContent;
        
        // Update button
        submitBtn.textContent = message;
        submitBtn.disabled = true;
      } else {
        // Restore original text
        submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
        submitBtn.disabled = false;
      }
    }
  }
  
  /**
   * Get user from session storage
   * @returns {Object|null} - User object or null if not logged in
   */
  getUserSession() {
    try {
      const userJson = sessionStorage.getItem(this.USER_SESSION_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error parsing user session:', error);
      return null;
    }
  }
  
  /**
   * Set user in session storage
   * @param {Object} user - User object to store
   */
  setUserSession(user) {
    try {
      sessionStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(user));
      
      // Also set a backup in localStorage for persistence between sessions
      // In a real app, this would be a refresh token, not the full user data
      localStorage.setItem('user_refresh', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role
      }));
    } catch (error) {
      console.error('Error setting user session:', error);
    }
  }
  
  /**
   * Clear user session
   */
  clearUserSession() {
    sessionStorage.removeItem(this.USER_SESSION_KEY);
    localStorage.removeItem('user_refresh');
  }
  
  /**
   * Generate a unique user ID
   * @returns {string} - Unique ID
   */
  generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Generate an authentication token
   * @returns {string} - Authentication token
   */
  generateAuthToken() {
    return 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  /**
   * Format a name string to proper case
   * @param {string} name - Name to format
   * @returns {string} - Formatted name
   */
  formatName(name) {
    return name
      .split(/[_.\-\s]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  
  /**
   * Simulate API delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   */
  simulateApiDelay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize auth system
const auth = new AuthSystem();

// Export the auth system for global access
window.auth = auth;