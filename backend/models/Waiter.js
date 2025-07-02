const mongoose = require('mongoose');

const waiterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  assignedTables: [{
    type: Number,
    min: 1
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Waiter', waiterSchema);