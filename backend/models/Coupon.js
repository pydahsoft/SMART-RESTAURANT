const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number }, // Only for percentage
  minOrderAmount: { type: Number },
  validFrom: { type: Date, required: true },
  validTill: { type: Date, required: true },
  maxUses: { type: Number, required: true },
  maxUsesPerUser: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', couponSchema);
