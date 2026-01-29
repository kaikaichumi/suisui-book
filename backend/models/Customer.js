const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  lineUserId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    default: ''
  },
  pictureUrl: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
