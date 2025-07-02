const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Waiter = require('../models/Waiter');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { sendOrderDeliverySMS } = require('../utils/smsService');
const OrderSequence = require('../models/OrderSequence');

// Helper function to generate default status message
const getDefaultStatusMessage = (status) => {
  const messages = {
    pending: 'Order has been placed and is waiting for confirmation',
    preparing: 'Order is being prepared in the kitchen',
    ready: 'Order is ready for pickup/delivery',
    delivered: 'Order has been delivered successfully',
    cancelled: 'Order has been cancelled'
  };
  return messages[status] || 'Order status has been updated';
};

// Get accountance statistics
router.get('/accountance', async (req, res) => {
  try {
    // Basic order counts
    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ 
        status: { $in: ['pending', 'preparing'] } 
      }),
      Order.countDocuments({ 
        status: 'delivered'
      })
    ]);

    // Calculate total amount from all completed orders
    const totalAmountResult = await Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'completed'] },
          totalAmount: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          total: { 
            $sum: { 
              $cond: [
                { $gt: ["$totalAmount", 0] },
                "$totalAmount",
                0
              ]
            }
          }
        }
      }
    ]).catch(err => {
      console.error('Error in total amount aggregation:', err);
      return [{ total: 0 }];
    });

    const data = {
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      completedOrders: completedOrders || 0,
      totalAmount: totalAmountResult[0]?.total || 0
    };

    console.log('Accountance data:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching accountance data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch accountance data',
      error: error.message 
    });
  }
});

// Update order payment
router.patch('/:orderId/payment', async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    
    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'upi'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Find and update the order
    const order = await Order.findOne({
      _id: req.params.orderId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment details
    order.paymentMethod = paymentMethod;
    order.paymentStatus = 'completed';
    
    await order.save();

    // Return updated order
    const updatedOrder = await Order.findById(order._id).populate('items.foodItem');
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders with user details (Public)
router.get('/all-orders', async (req, res) => {
  try {
    // Fetch all orders and populate necessary fields
    const orders = await Order.find()
      .populate('user', 'name')
      .populate('items.foodItem', 'name price');

    // Validate and normalize totalAmount for each order
    const validatedOrders = orders.map(order => {
      // Recalculate total from items to ensure accuracy
      const calculatedTotal = order.items.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        return sum + itemTotal;
      }, 0);

      // Use calculated total if stored total is invalid
      const finalTotal = 
        typeof order.totalAmount === 'number' && order.totalAmount > 0
          ? order.totalAmount
          : calculatedTotal;

      console.log(`Order ${order._id}: Stored: ${order.totalAmount}, Calculated: ${calculatedTotal}, Final: ${finalTotal}`);

      return {
        ...order.toObject(),
        totalAmount: finalTotal
      };
    });

    res.json(validatedOrders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get orders for waiter's assigned tables
router.get('/waiter-orders', auth, async (req, res) => {
  try {
    // Verify waiter role
    if (req.userType !== 'waiter') {
      console.log('Access denied: Not a waiter');
      return res.status(403).json({ message: 'Access denied. Waiter role required.' });
    }
    
    // Find waiter and verify
    const waiter = await Waiter.findById(req.userId);
    console.log('Found waiter:', {
      id: waiter?._id,
      assignedTables: waiter?.assignedTables
    });

    if (!waiter || !waiter.assignedTables || waiter.assignedTables.length === 0) {
      console.log('No assigned tables found for waiter');
      return res.status(403).json({ message: 'No assigned tables found' });
    }

    // Convert assigned tables to strings for comparison
    const assignedTableStrings = waiter.assignedTables.map(table => table.toString());

    // Find orders for assigned tables
    const query = {
      tableNumber: { $in: assignedTableStrings },
      status: { $in: ['pending', 'preparing', 'ready'] }
    };
    console.log('Querying orders with:', query);

    const orders = await Order.find(query)
      .populate('items.foodItem')
      .sort('-createdAt');

    console.log(`Found ${orders.length} orders for waiter`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching waiter orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Create new order with user registration/authentication
router.post('/', async (req, res) => {
  try {
    const { items, totalAmount, tableNumber, phoneNumber, customerName } = req.body;

    if (!tableNumber || tableNumber < 1 || tableNumber > 20) {
      return res.status(400).json({ message: 'Invalid table number' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;
    let token;

    if (user) {
      // Existing user - generate token
      token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    } else {
      // Create new user
      if (!customerName) {
        return res.status(400).json({ message: 'Customer name is required for new users' });
      }

      isNewUser = true;
      user = new User({
        name: customerName,
        phoneNumber,
        role: 'customer',
        orders: [] // Initialize empty orders array
      });
      await user.save();

      // Generate token for new user
      token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    }
    
    // Generate daily sequence number
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    let orderSeq = await OrderSequence.findOne({ date: dateStr });
    if (!orderSeq) {
      orderSeq = new OrderSequence({ date: dateStr, seq: 1 });
      await orderSeq.save();
    } else {
      orderSeq.seq += 1;
      await orderSeq.save();
    }
    const sequenceNumber = orderSeq.seq;

    // Create order with status comments and sequence number
    const order = new Order({
      user: user._id,
      items,
      totalAmount,
      tableNumber,
      sequenceNumber,
      comments: [{
        timestamp: new Date(),
        status: 'pending',
        text: 'Order has been placed and is waiting for confirmation'
      }]
    });

    await order.save();

    // Update user's orders array
    await User.findByIdAndUpdate(
      user._id,
      { $push: { orders: order._id } }
    );

    // Return order details along with authentication token
    res.status(201).json({
      order,
      token,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate('items.foodItem')
      .sort({ createdAt: -1 });
    // Ensure discountedAmount and appliedCoupon are always present in each order
    const ordersWithDiscount = orders.map(order => ({
      ...order.toObject(),
      discountedAmount: order.discountedAmount ?? null,
      appliedCoupon: order.appliedCoupon ?? null,
      sequenceNumber: order.sequenceNumber
    }));
    res.json(ordersWithDiscount);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order by ID
// Delete an item from an order
router.delete('/:orderId/items/:itemId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.foodItem');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Find the item and remove it
    const itemIndex = order.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    // Remove the item
    order.items.splice(itemIndex, 1);
    
    // Recalculate total amount
    order.totalAmount = order.items.reduce(
      (total, item) => total + (item.foodItem.price * item.quantity), 
      0
    );
    
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { status, comment } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.orderId)
      .populate('items.foodItem');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is already delivered or completed
    if (order.status === 'delivered' || order.status === 'completed') {
      return res.status(400).json({ 
        message: 'Cannot update status of a delivered or completed order' 
      });
    }

    // Add comment to the order
    const statusComment = {
      timestamp: new Date(),
      status: status,
      text: comment || getDefaultStatusMessage(status)
    };

    order.comments.push(statusComment);
    order.status = status;
    
    // If status is 'delivered', get user details and send SMS notification
    if (status === 'delivered' && order.user) {
      try {
        // Get user details from the user reference in order
        const userData = await User.findById(order.user);
        console.log('Found user data:', userData);

        if (userData && userData.phoneNumber) {
          console.log(`Sending delivery SMS to ${userData.phoneNumber} for order ${order._id}`);
          await sendOrderDeliverySMS(userData.phoneNumber, {
            _id: order._id,
            totalAmount: order.totalAmount,
          });
          
          // Add SMS sent comment with user details
          order.comments.push({
            text: `Delivery notification SMS sent to ${userData.name} (${userData.phoneNumber})`,
            status: 'delivered',
            timestamp: new Date(),
          });
          console.log('SMS sent successfully');
        } else {
          const errorMsg = !userData ? 'User not found' : 'No phone number found for user';
          console.log(`${errorMsg} for order ${order._id}`);
          order.comments.push({
            text: `Could not send delivery SMS: ${errorMsg}`,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Error while sending SMS:', error);
        order.comments.push({
          text: `Failed to send delivery SMS: ${error.message}`,
          timestamp: new Date(),
        });
      }
    } else if (status === 'delivered') {
      console.log('No user reference found in order');
      order.comments.push({
        text: 'Could not send delivery SMS: No user reference found',
        timestamp: new Date(),
      });
    }

    await order.save();

    // Prepare response message
    let message = `Order status updated to ${status}`;
    if (status === 'delivered') {
      message += order.user?.phoneNumber 
        ? '. Delivery SMS sent to customer.'
        : '. No phone number available for SMS notification.';
    }

    res.json({ 
      success: true, 
      message: message,
      order,
      smsSent: status === 'delivered' && order.user?.phoneNumber ? true : false
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get order details for a single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email') // Populate user details
      .populate('waiter', 'name') // Populate waiter details
      .populate('items.foodItem', 'name price description category') // Populate food items
      .lean(); // Convert to plain JavaScript object

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Add status message for each status in history
    if (order.statusHistory) {
      order.statusHistory = order.statusHistory.map(status => ({
        ...status,
        message: getDefaultStatusMessage(status.status)
      }));
    }

    // If no status history exists, create one from the current status
    if (!order.statusHistory || order.statusHistory.length === 0) {
      order.statusHistory = [{
        status: order.status,
        timestamp: order.updatedAt || order.createdAt,
        message: getDefaultStatusMessage(order.status)
      }];
    }

    res.json({
      success: true,
      order: {
        ...order,
        statusMessage: getDefaultStatusMessage(order.status),
        discountedAmount: order.discountedAmount ?? null,
        appliedCoupon: order.appliedCoupon ?? null
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, message: 'Error fetching order details' });
  }
});

// Get complete order details for printing
router.get('/print/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('items.foodItem')  // Populate food items
      .populate('waiter');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Transform the data for printing
    const printData = {
      ...order.toObject(),
      items: order.items.map(item => ({
        name: item.foodItem ? item.foodItem.name : 'Unknown Item',
        quantity: item.quantity,
        price: item.price,
        amount: item.quantity * item.price
      }))
    };

    res.json(printData);
  } catch (error) {
    console.error('Error fetching order details for printing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accountance statistics
router.get('/accountance', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ 
      status: { $in: ['pending', 'preparing'] }
    });
    const completedOrders = await Order.countDocuments({ 
      status: 'delivered'
    });
    const totalAmount = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Get payment method counts
    const cashOrders = await Order.countDocuments({ paymentMethod: 'cash' });
    const upiOrders = await Order.countDocuments({ paymentMethod: 'upi' });

    // Get daily revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalAmount: totalAmount[0]?.total || 0,
      cashOrders,
      upiOrders,
      dailyRevenue: dailyRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching accountance data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/public/:id', async (req, res) => {
  // Public endpoint to get order details by ID
  if (!req.params.id) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    
    // Find order and populate user and foodItem references
    const order = await Order.findById(id)
      .populate('user', 'name email phoneNumber') // Get user details
      .populate({
        path: 'items.foodItem',
        select: 'name price category description image' // Get food item details
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Transform the order data for better frontend usage
    const transformedOrder = {
      _id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      tableNumber: order.tableNumber,
      totalAmount: order.totalAmount,
      discountedAmount: order.discountedAmount ?? null,
      appliedCoupon: order.appliedCoupon ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      comments: order.comments,
      user: order.user ? {
        name: order.user.name,
        email: order.user.email,
        phoneNumber: order.user.phoneNumber
      } : null,
      items: order.items.map(item => ({
        quantity: item.quantity,
        price: item.price,
        foodItem: item.foodItem ? {
          name: item.foodItem.name,
          price: item.foodItem.price,
          category: item.foodItem.category,
          description: item.foodItem.description,
          image: item.foodItem.image
        } : null
      })),
      sequenceNumber: order.sequenceNumber,
    };

    res.json({ 
      success: true, 
      order: transformedOrder
    });
  } catch (error) {
    console.error('Error fetching public order details:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply coupon and update discountedAmount for an order
router.put('/:id/apply-coupon', async (req, res) => {
  try {
    const { discountedAmount, appliedCoupon } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { discountedAmount, appliedCoupon },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error applying coupon', error: error.message });
  }
});

module.exports = router;