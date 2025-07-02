const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Waiter = require('../models/Waiter');

const JWT_SECRET = process.env.JWT_SECRET; // Use environment variable only

// Register or Login with phone number
router.post('/phone-auth', async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;

    // Check if user exists
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name,
        phoneNumber
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Waiter Login
router.post('/waiter-login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Find waiter by phone number
    const waiter = await Waiter.findOne({ phoneNumber });

    if (!waiter || waiter.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token with waiter info
    const token = jwt.sign(
      {
        userId: waiter._id,
        role: 'waiter',
        assignedTables: waiter.assignedTables
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      waiterInfo: {
        id: waiter._id,
        name: waiter.name,
        phoneNumber: waiter.phoneNumber,
        assignedTables: waiter.assignedTables
      }
    });
  } catch (error) {
    console.error('Waiter login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;