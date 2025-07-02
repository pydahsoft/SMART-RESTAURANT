const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Waiter = require('../models/Waiter');

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.userId) {
      throw new Error('Invalid token structure');
    }

    // Handle waiter authentication
    if (decoded.role === 'waiter') {
      const waiter = await Waiter.findById(decoded.userId);
      if (!waiter) {
        throw new Error('Waiter not found');
      }
      req.user = waiter;
      req.userId = waiter._id;
      req.userType = 'waiter';
      req.assignedTables = decoded.assignedTables;
      next();
      return;
    }

    // Handle regular user authentication
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }
    req.user = user;
    req.userId = user._id;
    req.userType = 'user';
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;