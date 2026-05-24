const mongoose = require('mongoose');

const seasonalProductSchema = new mongoose.Schema({
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
  price: {
    type: Number
  },
  priceUnit: {
    type: String,
    default: ''
  },
  minOrderQuantity: {
    type: Number,
    default: 1
  },
  minOrderUnit: {
    type: String,
    default: ''
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: null
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
  aiSearchPhrases: { type: String, default: '' }
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
seasonalProductSchema.pre('validate', function() {
  if (this.slug) {
    this.slug = sanitizeSlug(this.slug);
  } else if (this.isModified('title') || !this.slug) {
    this.slug = sanitizeSlug(this.title || '');
  }
});

module.exports = mongoose.model('SeasonalProduct', seasonalProductSchema);
