const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi'],
  },
  tableNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  items: [{
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true    
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  discountedAmount: {
    type: Number,
    default: null
  },
  appliedCoupon: {
    type: String,
    default: null
  },
  comments: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled', 'completed'],
      required: true
    },
    text: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  sequenceNumber: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Order', orderSchema);