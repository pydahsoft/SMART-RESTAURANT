const express = require('express');
const router = express.Router();
const Waiter = require('../models/Waiter');
const Order = require('../models/Order'); // Import Order model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); // Import auth middleware

// Create a new waiter
router.post('/create', async (req, res) => {
  try {
    const { name, phoneNumber, password, assignedTables } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !password || !assignedTables) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate phone number format
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Validate assigned tables
    if (!Array.isArray(assignedTables) || assignedTables.length === 0) {
      return res.status(400).json({ message: 'At least one table must be assigned' });
    }

    // Validate table numbers
    if (assignedTables.some(table => !Number.isInteger(table) || table < 1)) {
      return res.status(400).json({ message: 'Invalid table numbers. Tables must be positive integers' });
    }

    // Check if waiter with phone number already exists
    const existingWaiter = await Waiter.findOne({ phoneNumber });
    if (existingWaiter) {
      return res.status(400).json({ message: 'Waiter with this phone number already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new waiter
    const waiter = new Waiter({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      password: hashedPassword,
      assignedTables: [...new Set(assignedTables)] // Remove duplicates
    });

    await waiter.save();

    // Return waiter data without password
    const waiterResponse = {
      _id: waiter._id,
      name: waiter.name,
      phoneNumber: waiter.phoneNumber,
      assignedTables: waiter.assignedTables
    };

    res.status(201).json(waiterResponse);
  } catch (error) {
    console.error('Server error in waiter creation:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Waiter with this phone number already exists' });
    }
    res.status(500).json({ 
      message: 'Server error while creating waiter',
      error: error.message 
    });
  }
});

// Get all waiters
router.get('/', async (req, res) => {
  try {
    const waiters = await Waiter.find({}, '-password'); // Exclude password field
    res.json(waiters);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update waiter
router.put('/:id', async (req, res) => {
  try {
    const { name, phoneNumber, assignedTables, password } = req.body;
    const waiterId = req.params.id;

    const updateData = {
      name,
      phoneNumber,
      assignedTables
    };

    // Only update password if it's provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const waiter = await Waiter.findByIdAndUpdate(
      waiterId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!waiter) {
      return res.status(404).json({ message: 'Waiter not found' });
    }

    res.json(waiter);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete waiter
router.delete('/:id', async (req, res) => {
  try {
    const waiter = await Waiter.findByIdAndDelete(req.params.id);
    
    if (!waiter) {
      return res.status(404).json({ message: 'Waiter not found' });
    }

    res.json({ message: 'Waiter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Waiter Login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Find waiter by phone number
    const waiter = await Waiter.findOne({ phoneNumber });
    if (!waiter) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, waiter.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token with correct structure
    const token = jwt.sign(
      { 
        userId: waiter._id,
        role: 'waiter',
        assignedTables: waiter.assignedTables 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return waiter data and token
    res.json({
      token,
      waiter: {
        id: waiter._id,
        name: waiter.name,
        phoneNumber: waiter.phoneNumber,
        assignedTables: waiter.assignedTables
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get orders for a waiter
router.get('/my-orders', auth, async (req, res) => {
  try {
    // Find the waiter and validate assigned tables
    const waiter = await Waiter.findById(req.userId);
    if (!waiter) {
      return res.status(404).json({ message: 'Waiter not found' });
    }

    // Get all orders for assigned tables
    const orders = await Order.find({
      tableNumber: { $in: waiter.assignedTables }
    })
    .populate('items.foodItem')
    .sort({ createdAt: -1 });

    // Format orders for clean output
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return {
        _id: orderObj._id,
        tableNumber: orderObj.tableNumber,
        status: orderObj.status,
        paymentStatus: orderObj.paymentStatus || 'pending',
        paymentMethod: orderObj.paymentMethod,
        orderTime: {
          created: orderObj.createdAt,
          updated: orderObj.updatedAt,
          formattedTime: new Date(orderObj.createdAt).toLocaleString()
        },
        items: orderObj.items.map(item => ({
          name: item.foodItem?.name || 'Unknown Item',
          quantity: item.quantity || 0,
          price: item.foodItem?.price || 0,
          subtotal: (item.quantity || 0) * (item.foodItem?.price || 0),
          notes: item.notes || ''
        })).filter(item => item.quantity > 0),
        summary: {
          totalAmount: orderObj.totalAmount || 0,
          totalItems: orderObj.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        },
        lastComment: orderObj.comments?.length > 0 
          ? {
              text: orderObj.comments[orderObj.comments.length - 1].text,
              time: new Date(orderObj.comments[orderObj.comments.length - 1].timestamp).toLocaleString()
            }
          : null
      };
    });

    // Send response with orders and assigned tables
    res.json({
      orders: formattedOrders,
      assignedTables: waiter.assignedTables
    });
  } catch (error) {
    console.error('Error fetching waiter orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
