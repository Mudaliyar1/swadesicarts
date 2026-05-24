const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  shortDescription: {
    type: String,
    default: '',
    trim: true
  },
  fullDescription: {
    type: String,
    default: '',
    trim: true
  },
  websiteUrl: {
    type: String,
    default: '',
    trim: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);