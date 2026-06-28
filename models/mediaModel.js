const mongoose = require('mongoose');

const usageLocationSchema = new mongoose.Schema(
  {
    relatedModel: { type: String, default: '' },
    relatedId: { type: String, default: '' },
    relatedTitle: { type: String, default: '' },
    usageSection: { type: String, default: '' }
  },
  { _id: false }
);

const mediaSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true, index: true },
    secureUrl: { type: String, default: '' },
    fileType: {
      type: String,
      enum: ['image', 'video', 'pdf', 'document', 'raw', 'unknown'],
      default: 'unknown',
      index: true
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw', 'unknown'],
      default: 'unknown',
      index: true
    },
    format: { type: String, default: '' },
    bytes: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now, index: true },

    relatedModel: { type: String, default: '' },
    relatedId: { type: String, default: '' },
    usageSection: { type: String, default: '' },

    usageLocations: { type: [usageLocationSchema], default: [] },
    isUsed: { type: Boolean, default: false, index: true },
    lastSyncedAt: { type: Date, default: Date.now },

    // Who uploaded this media
    uploadedByModel: { type: String, enum: ['User', 'Admin', 'System', 'EmailSync'], default: 'System', index: true },
    uploadedById:    { type: String, default: '' }
  },
  { timestamps: true }
);

mediaSchema.index({ fileType: 1, isUsed: 1, uploadedAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
