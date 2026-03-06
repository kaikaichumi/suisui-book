const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  priceMin: {
    type: Number,
    required: true,
    min: 0
  },
  priceMax: {
    type: Number,
    default: null,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 30,
    default: 60
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual: 向後相容，讓舊的 service.price 仍可用（回傳 priceMin）
serviceSchema.virtual('price').get(function () {
  return this.priceMin;
});

serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

serviceSchema.index({ storeId: 1, active: 1 });

module.exports = mongoose.model('Service', serviceSchema);
