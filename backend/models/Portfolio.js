const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: '',
    maxlength: 100
  },
  description: {
    type: String,
    default: '',
    maxlength: 300
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory'
  },
  tags: [{
    type: String,
    trim: true
  }],
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

portfolioSchema.index({ staffId: 1, active: 1, sortOrder: 1 });
portfolioSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Portfolio', portfolioSchema);
