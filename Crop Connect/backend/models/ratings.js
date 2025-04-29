// API Base URL
const API_URL = 'http://localhost:5000/api';

/**
 * Submit a rating for a completed order
 * @param {string} orderId - ID of the order
 * @param {number} score - Rating score (1-5)
 * @param {string} comment - Optional comment
 * @returns {Promise} - Promise resolving to submitted rating
 */
async function submitRating(orderId, score, comment = '') {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId, score, comment })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Could not submit rating');
    }
    
    return data.data;
  } catch (error) {
    console.error('Submit rating error:', error);
    throw error;
  }
}

/**
 * Get ratings for a seller
 * @param {string} sellerId - ID of the seller
 * @returns {Promise} - Promise resolving to seller ratings
 */
async function getSellerRatings(sellerId) {
  try {
    const response = await fetch(`${API_URL}/ratings/seller/${sellerId}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Could not fetch seller ratings');
    }
    
    return data.data;
  } catch (error) {
    console.error('Get seller ratings error:', error);
    throw error;
  }
}

/**
 * Get rating summary for a seller
 * @param {string} sellerId - ID of the seller
 * @returns {Promise} - Promise resolving to rating summary
 */
async function getSellerRatingSummary(sellerId) {
  try {
    const response = await fetch(`${API_URL}/ratings/summary/${sellerId}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Could not fetch rating summary');
    }
    
    return data.data;
  } catch (error) {
    console.error('Get rating summary error:', error);
    throw error;
  }
}

/**
 * Display star rating (read-only)
 * @param {HTMLElement} container - Container element to display rating
 * @param {number} score - Rating score (0-5)
 * @param {boolean} showText - Whether to show text beside stars
 */
function displayStarRating(container, score, showText = true) {
  const roundedScore = Math.round(score * 2) / 2; // Round to nearest 0.5
  let starsHTML = '';
  
  // Full stars
  for (let i = 1; i <= Math.floor(roundedScore); i++) {
    starsHTML += '<i class="fas fa-star text-warning"></i>';
  }
  
  // Half star
  if (roundedScore % 1 !== 0) {
    starsHTML += '<i class="fas fa-star-half-alt text-warning"></i>';
  }
  
  // Empty stars
  for (let i = Math.ceil(roundedScore); i < 5; i++) {
    starsHTML += '<i class="far fa-star text-warning"></i>';
  }
  
  if (showText) {
    starsHTML += `<span class="ms-2">${roundedScore.toFixed(1)}</span>`;
  }
  
  container.innerHTML = starsHTML;
}

/**
 * Create interactive star rating input
 * @param {HTMLElement} container - Container element for rating input
 * @param {Function} onRatingChange - Callback when rating changes
 */
function createRatingInput(container, onRatingChange) {
  let currentRating = 0;
  
  // Create 5 stars
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('i');
    star.className = 'far fa-star text-warning me-1';
    star.dataset.value = i;
    star.style.cursor = 'pointer';
    star.style.fontSize = '1.5rem';
    
    // Hover effect
    star.addEventListener('mouseover', function() {
      // Fill stars up to current
      for (let j = 1; j <= 5; j++) {
        const s = container.querySelector(`[data-value="${j}"]`);
        if (j <= i) {
          s.className = 'fas fa-star text-warning me-1';
        } else {
          s.className = 'far fa-star text-warning me-1';
        }
      }
    });
    
    // Reset stars on mouse out if not rated
    container.addEventListener('mouseout', function() {
      if (currentRating === 0) {
        for (let j = 1; j <= 5; j++) {
          const s = container.querySelector(`[data-value="${j}"]`);
          s.className = 'far fa-star text-warning me-1';
        }
      } else {
        // Reset to current rating
        for (let j = 1; j <= 5; j++) {
          const s = container.querySelector(`[data-value="${j}"]`);
          if (j <= currentRating) {
            s.className = 'fas fa-star text-warning me-1';
          } else {
            s.className = 'far fa-star text-warning me-1';
          }
        }
      }
    });
    
    // Set rating on click
    star.addEventListener('click', function() {
      currentRating = i;
      
      // Update stars
      for (let j = 1; j <= 5; j++) {
        const s = container.querySelector(`[data-value="${j}"]`);
        if (j <= currentRating) {
          s.className = 'fas fa-star text-warning me-1';
        } else {
          s.className = 'far fa-star text-warning me-1';
        }
      }
      
      // Call callback
      if (onRatingChange) {
        onRatingChange(currentRating);
      }
    });
    
    container.appendChild(star);
  }
  
  // Add rating value text
  const ratingText = document.createElement('span');
  ratingText.className = 'ms-2';
  ratingText.id = 'rating-value';
  container.appendChild(ratingText);
  
  // Update rating text when rating changes
  if (onRatingChange) {
    const originalCallback = onRatingChange;
    onRatingChange = function(rating) {
      document.getElementById('rating-value').textContent = rating > 0 ? `(${rating}/5)` : '';
      originalCallback(rating);
    };
  }
  
  return {
    getRating: () => currentRating,
    reset: () => {
      currentRating = 0;
      for (let j = 1; j <= 5; j++) {
        const s = container.querySelector(`[data-value="${j}"]`);
        s.className = 'far fa-star text-warning me-1';
      }
      document.getElementById('rating-value').textContent = '';
    }
  };
}

// Export functions
window.submitRating = submitRating;
window.getSellerRatings = getSellerRatings;
window.getSellerRatingSummary = getSellerRatingSummary;
window.displayStarRating = displayStarRating;
window.createRatingInput = createRatingInput;