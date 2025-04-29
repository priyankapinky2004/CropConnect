// backend/controllers/authController.js
const { auth, db, admin } = require('../firebase');

// @desc    Register user (seller or customer)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    // Validate role
    if (!['seller', 'customer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either seller or customer'
      });
    }
    
    // Check if user exists
    try {
      const userRecord = await auth.getUserByEmail(email);
      if (userRecord) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }
    } catch (error) {
      // Error will be thrown if user doesn't exist, which is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Set custom claims for role
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // Store additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
      phone: phone || '',
      location: location || '',
      profileImage: 'default-profile.png',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create custom token for immediate login
    const token = await auth.createCustomToken(userRecord.uid, { role });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userRecord.uid,
        name,
        email,
        role,
        phone: phone || '',
        location: location || ''
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not register user',
      error: error.message
    });
  }
};

// @desc    Login user (seller or customer)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // In a real app, you would use Firebase client SDK on frontend
    // This endpoint is mainly for API testing purposes
    
    // Find user by email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // We cannot verify password on backend with Firebase Admin SDK
    // In a real implementation, frontend would handle auth with Firebase client SDK
    // This is just for demonstration/testing purposes
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User data not found'
      });
    }
    
    const userData = userDoc.data();

    // Create custom token
    const token = await auth.createCustomToken(userRecord.uid, { role: userData.role });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: userRecord.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone || '',
        location: userData.location || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not login',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // User is already available from the auth middleware
    res.status(200).json({
      success: true,
      data: {
        id: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone || '',
        location: req.user.location || '',
        profileImage: req.user.profileImage || 'default-profile.png',
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not get user info',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    
    // Update user in Firebase Auth if name changed
    if (name && name !== req.user.name) {
      await auth.updateUser(req.user.uid, {
        displayName: name
      });
    }
    
    // Update user in Firestore
    await db.collection('users').doc(req.user.uid).update({
      name: name || req.user.name,
      phone: phone || req.user.phone,
      location: location || req.user.location,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated user data
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    res.status(200).json({
      success: true,
      data: {
        id: req.user.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone || '',
        location: userData.location || '',
        profileImage: userData.profileImage || 'default-profile.png'
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update profile',
      error: error.message
    });
  }
};
