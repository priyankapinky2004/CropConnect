const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

const router = express.Router();
console.log("Loading auth.js routes");
// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

module.exports = router;