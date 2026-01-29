const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  customerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

bookingSchema.index({ storeId: 1, date: 1 });
bookingSchema.index({ staffId: 1, date: 1 });
bookingSchema.index({ customerPhone: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
