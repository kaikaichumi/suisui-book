const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
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
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  specialties: [{
    type: String,
    trim: true
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory'
  }],
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    line: { type: String, default: '' }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  featured: {
    type: Boolean,
    default: false
  },
  discoverable: {
    type: Boolean,
    default: true
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  holidays: [{
    type: Date
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

staffSchema.index({ storeId: 1, active: 1 });
staffSchema.index({ slug: 1 }, { unique: true, sparse: true });
staffSchema.index({ categories: 1, discoverable: 1, active: 1 });
staffSchema.index({ 'rating.average': -1, 'rating.count': -1 });

module.exports = mongoose.model('Staff', staffSchema);
