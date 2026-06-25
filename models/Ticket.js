const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  senderName: String,
  message: {
    type: String,
    required: true
  },
  isEmailSync: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const dateStr = Date.now().toString().slice(-4);
      return `TKT-${dateStr}-${randomStr}`;
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  mobile: String,
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'resolved', 'closed'],
    default: 'open'
  },
  productType: {
    type: String,
    enum: ['seasonal', 'tech', 'organic', 'general']
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'productModel'
  },
  productModel: {
    type: String,
    enum: ['SeasonalProduct', 'TechPackage', 'OrganicProduct']
  },
  productTitle: String,
  messages: [messageSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Ticket', ticketSchema);
