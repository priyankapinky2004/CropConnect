// Replace your crops-fix.js with this simplified version

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded. Initializing crops page...');
  
  // Load mock data immediately for testing
  loadMockData();
  
  // Set up event listeners
  setupEventListeners();
});

// Function to load mock data for testing
function loadMockData() {
  console.log('Loading mock data for testing');
  
  // Create some sample crop data
  const sampleCrops = [
    {
      _id: "sample1",
      name: "Organic Tomatoes",
      description: "Fresh, locally grown organic tomatoes. Perfect for salads and cooking.",
      price: 2.99,
      unit: "kg",
      quantity: 50,
      category: "Vegetables",
      location: "Local Farm",
      sellerName: "John Farmer",
      cropImage: "https://images.unsplash.com/photo-1592924357228-91a4daadcfad?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date()
    },
    {
      _id: "sample2",
      name: "Fresh Spinach",
      description: "Nutrient-rich spinach leaves, harvested this morning.",
      price: 1.99,
      unit: "bunch",
      quantity: 30,
      category: "Leafy Greens",
      location: "Green Acres",
      sellerName: "Sarah Green",
      cropImage: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date()
    },
    {
      _id: "sample3",
      name: "Ripe Strawberries",
      description: "Sweet, juicy strawberries. Great for desserts or snacking.",
      price: 3.49,
      unit: "box",
      quantity: 25,
      category: "Fruits",
      location: "Berry Farm",
      sellerName: "Mike Berry",
      cropImage: "https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date()
    },
    {
      _id: "sample4",
      name: "Fresh Basil",
      description: "Aromatic basil leaves, perfect for Italian dishes and homemade pesto.",
      price: 1.49,
      unit: "bunch",
      quantity: 40,
      category: "Herbs",
      location: "Herb Garden", 
      sellerName: "Lisa Herb",
      cropImage: "https://images.unsplash.com/photo-1618375531912-867984bdfd87?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date()
    },
    {
      _id: "sample5",
      name: "Organic Brown Rice",
      description: "Naturally grown brown rice with no pesticides or chemicals.",
      price: 4.99,
      unit: "kg",
      quantity: 100,
      category: "Grains",
      location: "Rice Fields",
      sellerName: "Robert Rice",
      cropImage: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date()
    },
    {
      _id: "sample6",
      name: "Fresh Milk",
      description: "Farm-fresh, non-homogenized milk from grass-fed cows.",
      price: 2.49,
      unit: "liter",
      quantity: 30,
      category: "Dairy",
      location: "Green Pastures",
      sellerName: "David Dairy",
      cropImage: "https://images.unsplash.com/photo-1565504052130-29d2211554f8?auto=format&fit=crop&q=80&w=1000",
      createdAt: new Date()
    }
  ];
  
  // Set global variables
  window.allCrops = sampleCrops;
  window.filteredCrops = [...sampleCrops];
  window.currentPage = 1;
  window.cropsPerPage = 9;
  
  // Update results count
  const resultsCount = document.getElementById('results-count');
  if (resultsCount) {
    resultsCount.textContent = sampleCrops.length;
  }
  
  // Display crops
  displayCrops(sampleCrops, 1);
  setupPagination(sampleCrops.length);
}

// Display crops for the current page
function displayCrops(crops, page) {
  const cropsGrid = document.getElementById('crops-grid');
  if (!cropsGrid) {
    console.error('Error: crops-grid element not found');
    return;
  }
  
  const startIndex = (page - 1) * window.cropsPerPage;
  const endIndex = startIndex + window.cropsPerPage;
  const paginatedCrops = crops.slice(startIndex, endIndex);

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

    const resetBtn = document.getElementById('reset-search-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        clearFilters();
      });
    }

    return;
  }

  paginatedCrops.forEach(crop => {
    // Ensure crop has an _id field
    const cropId = crop._id || crop.id || 'unknown';
    
    // Format price properly
    const price = parseFloat(crop.price).toFixed(2);
    
    // Use default image if none provided
    const imageUrl = crop.cropImage || '../assets/img/default-crop.png';
    
    // Truncate description if too long
    const description = crop.description || '';
    const shortDescription = description.length > 100 ? 
      description.substring(0, 100) + '...' : description;
    
    // Create crop card
    cropsGrid.innerHTML += `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card crop-card h-100">
          <img src="${imageUrl}" class="card-img-top" alt="${crop.name}" onerror="this.src='../assets/img/default-crop.png'">
          <div class="card-body">
            <h5 class="card-title">${crop.name}</h5>
            <p class="card-text">${shortDescription}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-success fw-bold">$${price}/${crop.unit}</span>
              <span class="badge bg-primary">${crop.quantity} ${crop.unit} available</span>
            </div>
          </div>
          <div class="card-footer d-flex justify-content-between align-items-center">
            <small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i> ${crop.location || 'Unknown'}</small>
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
  addCardButtonListeners();
}

// Set up pagination
function setupPagination(totalCrops) {
  const totalPages = Math.max(1, Math.ceil(totalCrops / window.cropsPerPage));
  const pagination = document.getElementById('pagination');
  
  if (!pagination) {
    console.error('Error: pagination element not found');
    return;
  }
  
  pagination.innerHTML = '';

  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${window.currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" ${window.currentPage === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>Previous</a>`;
  pagination.appendChild(prevLi);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page-item ${i === window.currentPage ? 'active' : ''}`;
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pagination.appendChild(pageLi);

    // Add click event
    pageLi.addEventListener('click', function(e) {
      e.preventDefault();
      window.currentPage = i;
      displayCrops(window.filteredCrops, window.currentPage);
      setupPagination(window.filteredCrops.length);
      window.scrollTo(0, 0);
    });
  }

  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${window.currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" ${window.currentPage === totalPages ? 'tabindex="-1" aria-disabled="true"' : ''}>Next</a>`;
  pagination.appendChild(nextLi);

  // Add click events for prev/next
  if (window.currentPage > 1) {
    prevLi.addEventListener('click', function(e) {
      e.preventDefault();
      window.currentPage--;
      displayCrops(window.filteredCrops, window.currentPage);
      setupPagination(window.filteredCrops.length);
      window.scrollTo(0, 0);
    });
  }

  if (window.currentPage < totalPages) {
    nextLi.addEventListener('click', function(e) {
      e.preventDefault();
      window.currentPage++;
      displayCrops(window.filteredCrops, window.currentPage);
      setupPagination(window.filteredCrops.length);
      window.scrollTo(0, 0);
    });
  }
}

// Set up event listeners
function setupEventListeners() {
  // Category filter buttons
  document.querySelectorAll('.category-filter button').forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      document.querySelectorAll('.category-filter button').forEach(btn => {
        btn.classList.remove('active');
      });

      // Add active class to clicked button
      this.classList.add('active');

      // Filter crops by category
      const category = this.getAttribute('data-category');
      filterCropsByCategory(category);
    });
  });

  // View toggle buttons
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  
  if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener('click', function() {
      const cropsGrid = document.getElementById('crops-grid');
      if (cropsGrid) {
        cropsGrid.classList.remove('list-view');
      }
      this.classList.add('active');
      listViewBtn.classList.remove('active');
    });

    listViewBtn.addEventListener('click', function() {
      const cropsGrid = document.getElementById('crops-grid');
      if (cropsGrid) {
        cropsGrid.classList.add('list-view');
      }
      this.classList.add('active');
      gridViewBtn.classList.remove('active');
    });
  }

  // Apply filters button
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFilters);
  }
  
  // Clear filters link
  const clearFiltersLink = document.getElementById('clear-filters-link');
  if (clearFiltersLink) {
    clearFiltersLink.addEventListener('click', clearFilters);
  }
  
  // Search button
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchCrops);
  }

  // Search input - trigger search on Enter key
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        searchCrops();
      }
    });
  }
}

// Add event listeners to card buttons
function addCardButtonListeners() {
  // View buttons
  document.querySelectorAll('.view-crop-btn').forEach(button => {
    button.addEventListener('click', function() {
      const cropId = this.getAttribute('data-crop-id');
      viewCropDetails(cropId);
    });
  });

  // Order buttons
  document.querySelectorAll('.order-crop-btn').forEach(button => {
    button.addEventListener('click', function() {
      const cropId = this.getAttribute('data-crop-id');
      
      // Simple alert for now
      alert('Order function will be implemented in the next phase.');
    });
  });
}

// Filter crops by category
function filterCropsByCategory(category) {
  if (category === 'all') {
    // Show all crops
    window.filteredCrops = [...window.allCrops];
  } else {
    // Filter by category
    window.filteredCrops = window.allCrops.filter(crop => 
      crop.category && crop.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Reset to first page
  window.currentPage = 1;

  // Update results count
  const resultsCount = document.getElementById('results-count');
  if (resultsCount) {
    resultsCount.textContent = window.filteredCrops.length;
  }

  // Display crops
  displayCrops(window.filteredCrops, window.currentPage);
  setupPagination(window.filteredCrops.length);
}

// Apply filters
// Search crops by name or description
function searchCrops() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.toLowerCase();

  if (!searchTerm) {
    // If search is empty, show all crops with current filters
    window.filteredCrops = [...window.allCrops];
  } else {
    // Filter crops by search term
    window.filteredCrops = window.allCrops.filter(crop => {
      const cropName = (crop.name || '').toLowerCase();
      const cropDescription = (crop.description || '').toLowerCase();
      
      return cropName.includes(searchTerm) || cropDescription.includes(searchTerm);
    });
  }

  // Reset to first page
  window.currentPage = 1;

  // Update results count
  const resultsCount = document.getElementById('results-count');
  if (resultsCount) {
    resultsCount.textContent = window.filteredCrops.length;
  }

  // Display crops
  displayCrops(window.filteredCrops, window.currentPage);
  setupPagination(window.filteredCrops.length);
}

// Clear all filters
function clearFilters(e) {
  if (e) e.preventDefault();

  // Reset filter inputs
  const priceMin = document.getElementById('price-min');
  if (priceMin) priceMin.value = '';
  
  const priceMax = document.getElementById('price-max');
  if (priceMax) priceMax.value = '';
  
  const locationFilter = document.getElementById('location-filter');
  if (locationFilter) locationFilter.value = '';
  
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'newest';
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  // Reset category filters
  document.querySelectorAll('.category-filter button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const allCropsBtn = document.querySelector('.category-filter button[data-category="all"]');
  if (allCropsBtn) {
    allCropsBtn.classList.add('active');
  }

  // Reset filtered crops
  window.filteredCrops = [...window.allCrops];

  // Reset to first page
  window.currentPage = 1;

  // Update results count
  const resultsCount = document.getElementById('results-count');
  if (resultsCount) {
    resultsCount.textContent = window.filteredCrops.length;
  }

  // Display crops
  displayCrops(window.filteredCrops, window.currentPage);
  setupPagination(window.filteredCrops.length);
}

// View crop details
function viewCropDetails(cropId) {
  const crop = window.allCrops.find(c => c._id === cropId || c.id === cropId);

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
  const price = parseFloat(crop.price || 0).toFixed(2);
  
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

        <p><i class="fas fa-map-marker-alt me-1"></i> <strong>Location:</strong> ${crop.location || 'Unknown'}</p>
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
  const cropDetailsModal = document.getElementById('cropDetailsModal');
  if (cropDetailsModal) {
    const modal = new bootstrap.Modal(cropDetailsModal);
    modal.show();

    // Add event listener for the order button
    const modalOrderBtn = document.getElementById('modal-order-btn');
    if (modalOrderBtn) {
      modalOrderBtn.addEventListener('click', function() {
        // Hide details modal
        modal.hide();
        
        // Simple alert for now
        alert('Order function will be implemented in the next phase.');
      });
    }
  }
}

function applyFilters() {
  const priceMin = parseFloat(document.getElementById('price-min')?.value) || 0;
  const priceMax = parseFloat(document.getElementById('price-max')?.value) || Infinity;
  const location = document.getElementById('location-filter')?.value?.toLowerCase() || '';
  const sortBy = document.getElementById('sort-select')?.value || 'newest';

  // Start with all crops
  let filtered = [...window.allCrops];
  
  // Apply price filter
  filtered = filtered.filter(crop => {
    const cropPrice = parseFloat(crop.price) || 0;
    return cropPrice >= priceMin && cropPrice <= priceMax;
  });
  
  // Apply location filter
  if (location) {
    filtered = filtered.filter(crop => {
      const cropLocation = (crop.location || '').toLowerCase();
      return cropLocation.includes(location);
    });
  }
  
  // Apply sort
  switch (sortBy) {
    case 'price-low':
      filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
      break;
    case 'price-high':
      filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
      break;
    case 'name-asc':
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'name-desc':
      filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      break;
    default:
      // 'newest' or any other value
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  // Update filtered crops
  window.filteredCrops = filtered;
  
  // Reset to first page
  window.currentPage = 1;
  
  // Update results count
  const resultsCount = document.getElementById('results-count');
  if (resultsCount) {
    resultsCount.textContent = window.filteredCrops.length;
  }
  
  // Display crops
  displayCrops(window.filteredCrops, window.currentPage);
  setupPagination(window.filteredCrops.length);
}