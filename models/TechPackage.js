const mongoose = require('mongoose');

const techPackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200
  },
  fullDescription: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  price: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    displayText: String,
    note: String
  },
  featuredImage: {
    url: String,
    publicId: String
  },
  gallery: [{
    url: String,
    publicId: String,
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    }
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  // SEO & GEO Keyword Optimization
  seoTitle: { type: String, default: '' },
  seoMetaDescription: { type: String, default: '' },
  seoKeywords: { type: String, default: '' },
  geoKeywords: { type: String, default: '' },
  longTailKeywords: { type: String, default: '' },
  aiSearchPhrases: { type: String, default: '' },
  geoSummary: { type: String, default: '' },
  aiDescription: { type: String, default: '' },
  aiKeywords: { type: String, default: '' },
  aiCategoryDescription: { type: String, default: '' },
  entityDescription: { type: String, default: '' }
}, {
  timestamps: true
});

// Helper: sanitize a slug string
function sanitizeSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Generate or sanitize slug before validation
techPackageSchema.pre('validate', function() {
  if (this.slug) {
    this.slug = sanitizeSlug(this.slug);
  } else if (this.isModified('title') || !this.slug) {
    this.slug = sanitizeSlug(this.title || '');
  }
});

module.exports = mongoose.model('TechPackage', techPackageSchema);
