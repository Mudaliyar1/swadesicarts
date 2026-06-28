const mongoose = require('mongoose');

const criticalAlertSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    default: null,
    trim: true,
    lowercase: true
  },
  userPhone: {
    type: String,
    default: null,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true
  },
  blockedUntil: {
    type: Date,
    required: true
  },
  isResolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CriticalAlert', criticalAlertSchema);
