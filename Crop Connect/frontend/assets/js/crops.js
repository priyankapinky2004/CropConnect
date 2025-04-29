// Save this as crops.js in your frontend/assets/js folder

// Global variables
let allCrops = []; // Stores all loaded crops
let filteredCrops = []; // Stores currently filtered crops
let currentPage = 1;
const cropsPerPage = 9;
const API_URL = 'http://localhost:5000/api'; // Set your API URL here

// Load all crops from API with better error handling
async function loadCrops() {
  try {
    console.log('Fetching crops from API...');
    const cropsGrid = document.getElementById('crops-grid');
    
    // Display loading spinner
    cropsGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading crops...</p>
      </div>
    `;
    
    // Fetch crops from API
    const response = await fetch(`${API_URL}/crops`);
    const data = await response.json();
    
    console.log('API response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Could not fetch crops');
    }
    
    // Update global crops array
    allCrops = data.data || [];
    filteredCrops = [...allCrops];
    
    // Update results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = filteredCrops.length;
    }
    
    // Display crops
    displayCrops(filteredCrops, currentPage);
    setupPagination(filteredCrops.length);
    
    // If no crops found, show add sample crops button for debugging
    if (allCrops.length === 0) {
      const isAdmin = localStorage.getItem('isAdmin') === 'true'; // For testing only
      
      cropsGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>No crops found in the database.
          </div>
          ${isAdmin ? `
            <button class="btn btn-primary mt-3" id="add-sample-crops-btn">
              <i class="fas fa-plus me-2"></i>Add Sample Crops (Admin Only)
            </button>
          ` : ''}
        </div>
      `;
      
      // Add event listener for sample crops button (admin only)
      const addSampleBtn = document.getElementById('add-sample-crops-btn');
      if (addSampleBtn) {
        addSampleBtn.addEventListener('click', addSampleCrops);
      }
    }
  } catch (error) {
    console.error('Load crops error:', error);
    
    // Show error message with retry button
    const cropsGrid = document.getElementById('crops-grid');
    cropsGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>Error loading crops: ${error.message}
        </div>
        <div class="text-center mt-3">
          <button class="btn btn-primary" id="retry-load-btn">
            <i class="fas fa-sync me-2"></i>Retry
          </button>
        </div>
      </div>
    `;
    
    // Add event listener for retry button
    document.getElementById('retry-load-btn').addEventListener('click', loadCrops);
  }
}

// Debug function to add sample crops (admin only)
async function addSampleCrops() {
  try {
    // This is for development/testing only
    const sampleCrops = [
      {
        name: 'Organic Tomatoes',
        description: 'Fresh organic tomatoes grown without pesticides. Perfect for salads and cooking.',
        price: 3.99,
        quantity: 50,
        unit: 'kg',
        location: 'Cropville Farms',
        sellerName: 'John Farmer',
        sellerId: 'test-user',
        harvestDate: new Date().toISOString(),
        category: 'vegetables'
      },
      {
        name: 'Fresh Apples',
        description: 'Sweet and juicy apples freshly picked from our orchard. Great for snacking or baking.',
        price: 2.49,
        quantity: 100,
        unit: 'kg',
        location: 'Apple Valley',
        sellerName: 'John Farmer',
        sellerId: 'test-user',
        harvestDate: new Date().toISOString(),
        category: 'fruits'
      },
      {
        name: 'Organic Potatoes',
        description: 'Locally grown organic potatoes. Versatile for many dishes.',
        price: 1.99,
        quantity: 75,
        unit: 'kg',
        location: 'Cropville Farms',
        sellerName: 'John Farmer',
        sellerId: 'test-user',
        harvestDate: new Date().toISOString(),
        category: 'vegetables'
      }
    ];
    
    for (const crop of sampleCrops) {
      await fetch(`${API_URL}/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',  // For testing only
          'X-Test-Role': 'seller'  // For testing only
        },
        body: JSON.stringify(crop)
      });
    }
    
    alert('Sample crops added successfully!');
    loadCrops(); // Reload crops
  } catch (error) {
    console.error('Error adding sample crops:', error);
    alert(`Error adding sample crops: ${error.message}`);
  }
}

// Display crops for current page with better error handling
function displayCrops(crops, page) {
  const startIndex = (page - 1) * cropsPerPage;
  const endIndex = startIndex + cropsPerPage;
  const paginatedCrops = crops.slice(startIndex, endIndex);

  const cropsGrid = document.getElementById('crops-grid');
  cropsGrid.innerHTML = '';

  if (paginatedCrops.length === 0) {
    cropsGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>No crops found matching your criteria.
        </div>
        <button class="btn btn-primary mt-3" id="reset-search-btn">
          <i class="fas fa-sync me-2"></i>Reset Search
        </button>
      </div>
    `;

    document.getElementById('reset-search-btn').addEventListener('click', function() {
      clearFilters();
    });

    return;
  }

  paginatedCrops.forEach(crop => {
    // Ensure crop has an _id field
    const cropId = crop._id || crop.id || 'unknown';
    
    // Format price properly
    const price = parseFloat(crop.price).toFixed(2);
    
    // Use default image if none provided
    const imageUrl = crop.cropImage || '../assets/img/default-crop.png';
    
    // Create crop card
    cropsGrid.innerHTML += `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card crop-card h-100">
          <img src="${imageUrl}" class="card-img-top" alt="${crop.name}" onerror="this.src='../assets/img/default-crop.png'">
          <div class="card-body">
            <h5 class="card-title">${crop.name}</h5>
            <p class="card-text">${crop.description.substring(0, 100)}${crop.description.length > 100 ? '...' : ''}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-success fw-bold">${price}/${crop.unit}</span>
              <span class="badge bg-primary">${crop.quantity} ${crop.unit} available</span>
            </div>
          </div>
          <div class="card-footer d-flex justify-content-between align-items-center">
            <small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i> ${crop.location}</small>
            <div>
              <button class="btn btn-sm btn-outline-primary view-crop-btn" data-crop-id="${cropId}">
                <i class="fas fa-eye"></i> View
              </button>
              <button class="btn btn-sm btn-primary order-crop-btn" data-crop-id="${cropId}">
                <i class="fas fa-shopping-cart"></i> Order
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  // Add event listeners for view and order buttons
  document.querySelectorAll('.view-crop-btn').forEach(button => {
    button.addEventListener('click', function() {
      const cropId = this.getAttribute('data-crop-id');
      viewCropDetails(cropId);
    });
  });

  document.querySelectorAll('.order-crop-btn').forEach(button => {
    button.addEventListener('click', function() {
      const cropId = this.getAttribute('data-crop-id');
      openOrderModal(cropId);
    });
  });
}

// Set up pagination with improved reliability
function setupPagination(totalCrops) {
  const totalPages = Math.ceil(totalCrops / cropsPerPage) || 1; // Ensure at least 1 page
  const pagination = document.getElementById('pagination');
  
  if (!pagination) return; // Safeguard
  
  pagination.innerHTML = '';

  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" ${currentPage === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>Previous</a>`;
  pagination.appendChild(prevLi);

  // Page numbers (limit to 5 pages with ellipsis for better UX)
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust if near end
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  // Add ellipsis at start if needed
  if (startPage > 1) {
    const ellipsisStart = document.createElement('li');
    ellipsisStart.className = 'page-item disabled';
    ellipsisStart.innerHTML = '<span class="page-link">...</span>';
    pagination.appendChild(ellipsisStart);
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pagination.appendChild(pageLi);

    // Add click event
    pageLi.addEventListener('click', function(e) {
      e.preventDefault();
      currentPage = i;
      displayCrops(filteredCrops, currentPage);
      setupPagination(filteredCrops.length);
      window.scrollTo(0, 0);
    });
  }
  
  // Add ellipsis at end if needed
  if (endPage < totalPages) {
    const ellipsisEnd = document.createElement('li');
    ellipsisEnd.className = 'page-item disabled';
    ellipsisEnd.innerHTML = '<span class="page-link">...</span>';
    pagination.appendChild(ellipsisEnd);
  }

  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" ${currentPage === totalPages ? 'tabindex="-1" aria-disabled="true"' : ''}>Next</a>`;
  pagination.appendChild(nextLi);

  // Add click events for prev/next
  if (currentPage > 1) {
    prevLi.addEventListener('click', function(e) {
      e.preventDefault();
      currentPage--;
      displayCrops(filteredCrops, currentPage);
      setupPagination(filteredCrops.length);
      window.scrollTo(0, 0);
    });
  }

  if (currentPage < totalPages) {
    nextLi.addEventListener('click', function(e) {
      e.preventDefault();
      currentPage++;
      displayCrops(filteredCrops, currentPage);
      setupPagination(filteredCrops.length);
      window.scrollTo(0, 0);
    });
  }
}

// Apply filters with improved error handling
function applyFilters() {
  try {
    const priceMin = parseFloat(document.getElementById('price-min').value) || 0;
    const priceMax = parseFloat(document.getElementById('price-max').value) || Infinity;
    const location = document.getElementById('location-filter').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;

    // Filter crops
    filteredCrops = allCrops.filter(crop => {
      // Parse price as float to ensure comparison works
      const cropPrice = parseFloat(crop.price);
      
      const priceMatch = cropPrice >= priceMin && cropPrice <= priceMax;
      const locationMatch = !location || (crop.location && crop.location.toLowerCase().includes(location));
      
      return priceMatch && locationMatch;
    });

    // Sort crops
    sortCrops(sortBy);

    // Reset to first page
    currentPage = 1;

    // Update results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = filteredCrops.length;
    }

    // Display crops
    displayCrops(filteredCrops, currentPage);
    setupPagination(filteredCrops.length);
  } catch (error) {
    console.error('Apply filters error:', error);
    alert('Error applying filters. Please try again.');
  }
}

// View crop details with better error handling
function viewCropDetails(cropId) {
  try {
    const crop = allCrops.find(c => c._id === cropId || c.id === cropId);

    if (!crop) {
      console.error('Crop not found with ID:', cropId);
      alert('Crop not found');
      return;
    }

    const cropDetailsContent = document.getElementById('crop-details-content');
    if (!cropDetailsContent) {
      console.error('Crop details container not found');
      return;
    }

    // Format price properly
    const price = parseFloat(crop.price).toFixed(2);
    
    // Format harvest date
    const harvestDate = crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : 'Unknown';
    
    // Use default image if none provided
    const imageUrl = crop.cropImage || '../assets/img/default-crop.png';

    cropDetailsContent.innerHTML = `
      <div class="row">
        <div class="col-md-5">
          <img src="${imageUrl}" class="img-fluid rounded" alt="${crop.name}" onerror="this.src='../assets/img/default-crop.png'">
        </div>
        <div class="col-md-7">
          <h3>${crop.name}</h3>
          <p>${crop.description}</p>

          <div class="d-flex justify-content-between mb-3">
            <h4 class="text-success">${price}/${crop.unit}</h4>
            <span class="badge bg-primary">${crop.quantity} ${crop.unit} available</span>
          </div>

          <p><i class="fas fa-map-marker-alt me-1"></i> <strong>Location:</strong> ${crop.location}</p>
          <p><i class="fas fa-calendar-alt me-1"></i> <strong>Harvest Date:</strong> ${harvestDate}</p>
          <p><i class="fas fa-user me-1"></i> <strong>Farmer:</strong> ${crop.sellerName || 'Unknown'}</p>

          <div class="mt-4">
            <button class="btn btn-primary" id="modal-order-btn" data-crop-id="${cropId}">
              <i class="fas fa-shopping-cart me-2"></i>Place Order
            </button>
          </div>
        </div>
      </div>
    `;

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('cropDetailsModal'));
    modal.show();

    // Add event listener for the order button
    document.getElementById('modal-order-btn').addEventListener('click', function() {
      // Hide details modal
      modal.hide();

      // Open order modal
      openOrderModal(this.getAttribute('data-crop-id'));
    });
  } catch (error) {
    console.error('View crop details error:', error);
    alert('Error loading crop details. Please try again.');
  }
}

// Clear all filters and reset to original state
function clearFilters(e) {
  if (e) e.preventDefault();

  try {
    // Reset filter inputs
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    const locationFilter = document.getElementById('location-filter');
    const sortSelect = document.getElementById('sort-select');
    const searchInput = document.getElementById('search-input');
    
    if (priceMin) priceMin.value = '';
    if (priceMax) priceMax.value = '';
    if (locationFilter) locationFilter.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    if (searchInput) searchInput.value = '';

    // Reset category filters
    document.querySelectorAll('.category-filter button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const allCropsBtn = document.querySelector('.category-filter button[data-category="all"]');
    if (allCropsBtn) allCropsBtn.classList.add('active');

    // Reset filtered crops
    filteredCrops = [...allCrops];

    // Reset to first page
    currentPage = 1;

    // Update results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = filteredCrops.length;
    }

    // Display crops
    displayCrops(filteredCrops, currentPage);
    setupPagination(filteredCrops.length);
  } catch (error) {
    console.error('Clear filters error:', error);
    alert('Error clearing filters. Please refresh the page and try again.');
  }
}