const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  requirement: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    required: true,
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
  productTitle: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new'
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ productType: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
