const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'waiter', 'chef', 'server'],
    default: 'customer'
  },
  assignedTables: {
    type: [Number],
    default: [],
    validate: {
      validator: function(v) {
        // Only require tables if role is waiter
        if (this.role === 'waiter') {
          return Array.isArray(v) && v.length > 0;
        }
        return true;
      },
      message: 'Waiter must have at least one assigned table'
    }
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);