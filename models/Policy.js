const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  // SEO Optimization Fields
  seoTitle: {
    type: String,
    default: '',
    trim: true
  },
  seoDescription: {
    type: String,
    default: '',
    trim: true
  },
  seoKeywords: {
    type: String,
    default: '',
    trim: true
  },
  // GEO Search & AI Discoverability Fields
  geoSummary: {
    type: String,
    default: '',
    trim: true
  },
  aiDescription: {
    type: String,
    default: '',
    trim: true
  },
  entityDescription: {
    type: String,
    default: '',
    trim: true
  },
  aiSearchKeywords: {
    type: String,
    default: '',
    trim: true
  },
  structuredAiMetadata: {
    type: String,
    default: '{}',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Policy', policySchema);
