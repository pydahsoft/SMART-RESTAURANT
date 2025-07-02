const mongoose = require('mongoose');

const orderSequenceSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('OrderSequence', orderSequenceSchema);
