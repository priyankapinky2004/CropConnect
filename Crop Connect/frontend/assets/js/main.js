// Main JavaScript file for shared functionality across all pages

// Check if user is authenticated on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
  });
  
  // Update navigation based on authentication status
  function updateNavigation() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // If we have a navigation menu on the page
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;
    
    if (token && user) {
      // Create authenticated navigation
      let navHTML = `
        <li class="nav-item">
          <a class="nav-link" href="index.html">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="browse-crops.html">Browse Crops</a>
        </li>
      `;
      
      // Role-specific items
      if (user.role === 'seller') {
        navHTML += `
          <li class="nav-item">
            <a class="nav-link" href="seller-dashboard.html">My Dashboard</a>
          </li>
        `;
      } else if (user.role === 'customer') {
        navHTML += `
          <li class="nav-item">
            <a class="nav-link" href="customer-dashboard.html">My Dashboard</a>
          </li>
        `;
      }
      
      navHTML += `
        <li class="nav-item">
          <a class="nav-link" href="profile.html">My Profile</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="logout-btn">Logout</a>
        </li>
      `;
      
      navMenu.innerHTML = navHTML;
      
      // Add logout event listener
      document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
      });
    } else {
      // Default navigation for non-authenticated users
      navMenu.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="index.html">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="browse-crops.html">Browse Crops</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="about.html">About Us</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="contact.html">Contact</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="login.html">Login</a>
        </li>
        <li class="nav-item">
          <a class="btn btn-outline-light ms-2" href="register.html">Sign Up</a>
        </li>
      `;
    }
    
    // Update active link based on current page
    setActiveNavLink();
  }
  
  // Set active navigation link based on current page
  function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('#nav-menu .nav-link');
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      }
    });
  }
  
  // Format date to readable format
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }
  
  // Format currency
  function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
  }
  
  // Show loading spinner
  function showLoader(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      `;
    }
  }
  
  // Show error message
  function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>${message}
        </div>
      `;
    }
  }
  
  // Truncate text to specified length
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
  
  // Copy text to clipboard
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }
  
  // Get URL parameters
  function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  
  // Validate email format
  function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  
  // Validate password strength
  function isStrongPassword(password) {
    // At least 6 characters, with at least one letter and one number
    return password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  }
  
  // Handle form validation
  function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    let isValid = true;
    
    for (const fieldId in rules) {
      const field = document.getElementById(fieldId);
      const value = field.value.trim();
      const rule = rules[fieldId];
      
      // Remove any existing error message
      const existingError = field.parentElement.querySelector('.invalid-feedback');
      if (existingError) existingError.remove();
      
      field.classList.remove('is-invalid');
      
      // Check if field is required and empty
      if (rule.required && !value) {
        field.classList.add('is-invalid');
        addErrorMessage(field, rule.required === true ? 'This field is required' : rule.required);
        isValid = false;
        continue;
      }
      
      // Check if field has minimum length
      if (rule.minLength && value.length < rule.minLength) {
        field.classList.add('is-invalid');
        addErrorMessage(field, `Minimum length is ${rule.minLength} characters`);
        isValid = false;
        continue;
      }
      
      // Check if field is an email
      if (rule.email && value && !isValidEmail(value)) {
        field.classList.add('is-invalid');
        addErrorMessage(field, 'Please enter a valid email address');
        isValid = false;
        continue;
      }
      
      // Check if field is a password
      if (rule.password && value && !isStrongPassword(value)) {
        field.classList.add('is-invalid');
        addErrorMessage(field, 'Password must be at least 6 characters with at least one letter and one number');
        isValid = false;
        continue;
      }
      
      // Check if field matches another field
      if (rule.matches && value !== document.getElementById(rule.matches).value) {
        field.classList.add('is-invalid');
        addErrorMessage(field, 'Fields do not match');
        isValid = false;
        continue;
      }
    }
    
    return isValid;
  }
  import { translatePage } from './translation.js';

document.getElementById("languageSwitcher").addEventListener("change", (e) => {
  const lang = e.target.value;
  translatePage(lang);
});
  // Add error message to a field
  function addErrorMessage(field, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    field.parentElement.appendChild(errorDiv);
  }
  
  // Export functions to window object
  window.updateNavigation = updateNavigation;
  window.setActiveNavLink = setActiveNavLink;
  window.formatDate = formatDate;
  window.formatCurrency = formatCurrency;
  window.showLoader = showLoader;
  window.showError = showError;
  window.truncateText = truncateText;
  window.copyToClipboard = copyToClipboard;
  window.getUrlParam = getUrlParam;
  window.isValidEmail = isValidEmail;
  window.isStrongPassword = isStrongPassword;
  window.validateForm = validateForm;