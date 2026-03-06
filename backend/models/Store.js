const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const businessHoursSchema = new mongoose.Schema({
  open: { type: String, default: '09:00' },
  close: { type: String, default: '18:00' },
  closed: { type: Boolean, default: false }
}, { _id: false });

const storeSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  // GeoJSON location for 2dsphere geo queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  coverImage: {
    type: String,
    default: ''
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory'
  }],
  notificationSettings: {
    newBooking: {
      email: { type: Boolean, default: true },
      line: { type: Boolean, default: false }
    },
    cancellation: {
      email: { type: Boolean, default: true },
      line: { type: Boolean, default: false }
    }
  },
  businessHours: {
    mon: { type: businessHoursSchema, default: () => ({}) },
    tue: { type: businessHoursSchema, default: () => ({}) },
    wed: { type: businessHoursSchema, default: () => ({}) },
    thu: { type: businessHoursSchema, default: () => ({}) },
    fri: { type: businessHoursSchema, default: () => ({}) },
    sat: { type: businessHoursSchema, default: () => ({}) },
    sun: { type: businessHoursSchema, default: () => ({ closed: true }) }
  },
  holidays: [{
    type: Date
  }],
  passwordHash: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ categories: 1, active: 1 });

storeSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

storeSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Store', storeSchema);
