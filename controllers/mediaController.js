const Media = require('../models/mediaModel');
const WebsiteSetting = require('../models/WebsiteSetting');
const Company = require('../models/companyModel');
const Story = require('../models/Story');
const SeasonalProduct = require('../models/SeasonalProduct');
const OrganicProduct = require('../models/OrganicProduct');
const TechPackage = require('../models/TechPackage');
const { getCloudinaryUsage, getAllCloudinaryAssets, deleteCloudinaryAsset, inferFileType } = require('../helpers/cloudinaryHelper');

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

// Caching and syncing state variables
let cachedCloudinaryUsage = null;
let lastUsageFetchTime = 0;
let isSyncing = false;
let lastSyncTime = 0;

const getCloudinaryUsageCached = async () => {
  const cacheDuration = 5 * 60 * 1000; // 5 minutes cache
  if (cachedCloudinaryUsage && (Date.now() - lastUsageFetchTime < cacheDuration)) {
    return cachedCloudinaryUsage;
  }
  const usage = await getCloudinaryUsage();
  if (usage) {
    cachedCloudinaryUsage = usage;
    lastUsageFetchTime = Date.now();
  }
  return cachedCloudinaryUsage;
};

const buildUsageLocations = (asset, settings, companies, stories, seasonalProducts, organicProducts, techPackages) => {
  const locations = [];
  const publicUrl = asset.secureUrl || '';
  const publicId = asset.publicId || '';

  const pushLocation = (relatedModel, relatedId, relatedTitle, usageSection) => {
    if (!relatedId && !relatedTitle) return;
    locations.push({ relatedModel, relatedId: relatedId ? String(relatedId) : '', relatedTitle: relatedTitle || '', usageSection });
  };

  if (settings) {
    if (settings.logo && (settings.logo.publicId === publicId || settings.logo.url === publicUrl)) {
      pushLocation('WebsiteSetting', settings._id, 'Website Settings', 'Site Logo');
    }

    if (Array.isArray(settings.carousel)) {
      settings.carousel.forEach((slide, index) => {
        if (slide.media && (slide.media.publicId === publicId || slide.media.url === publicUrl)) {
          pushLocation('WebsiteSetting', settings._id, 'Homepage Carousel', `Homepage Carousel Slide ${index + 1}`);
        }
      });
    }

    if (settings.about && settings.about.image && (settings.about.image.publicId === publicId || settings.about.image.url === publicUrl)) {
      pushLocation('WebsiteSetting', settings._id, 'About Page', 'About Image');
    }

    if (settings.about && Array.isArray(settings.about.teamMembers)) {
      settings.about.teamMembers.forEach((member, index) => {
        if (member.image && (member.image.publicId === publicId || member.image.url === publicUrl)) {
          pushLocation('WebsiteSetting', settings._id, 'About Page', `Team Member ${index + 1}`);
        }
      });
    }
  }

  companies.forEach((company) => {
    if (company.logo && (company.logo.publicId === publicId || company.logo.url === publicUrl)) {
      pushLocation('Company', company._id, company.name, 'Company Logo');
    }
  });

  stories.forEach((story) => {
    if (Array.isArray(story.media)) {
      story.media.forEach((media, index) => {
        if (media.publicId === publicId || media.url === publicUrl) {
          pushLocation('Story', story._id, story.title, `Story Media ${index + 1}`);
        }
      });
    }
  });

  seasonalProducts.forEach((product) => {
    if (product.featuredImage && (product.featuredImage.publicId === publicId || product.featuredImage.url === publicUrl)) {
      pushLocation('SeasonalProduct', product._id, product.title, 'Featured Image');
    }
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((media, index) => {
        if (media.publicId === publicId || media.url === publicUrl) {
          pushLocation('SeasonalProduct', product._id, product.title, `Gallery Item ${index + 1}`);
        }
      });
    }
  });

  organicProducts.forEach((product) => {
    if (product.featuredImage && (product.featuredImage.publicId === publicId || product.featuredImage.url === publicUrl)) {
      pushLocation('OrganicProduct', product._id, product.title, 'Featured Image');
    }
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((media, index) => {
        if (media.publicId === publicId || media.url === publicUrl) {
          pushLocation('OrganicProduct', product._id, product.title, `Gallery Item ${index + 1}`);
        }
      });
    }
  });

  techPackages.forEach((product) => {
    if (product.featuredImage && (product.featuredImage.publicId === publicId || product.featuredImage.url === publicUrl)) {
      pushLocation('TechPackage', product._id, product.title, 'Featured Image');
    }
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((media, index) => {
        if (media.publicId === publicId || media.url === publicUrl) {
          pushLocation('TechPackage', product._id, product.title, `Gallery Item ${index + 1}`);
        }
      });
    }
  });

  return locations;
};

const syncMediaLibrary = async (force = false) => {
  if (isSyncing && !force) return 0;
  isSyncing = true;
  try {
    const assets = await getAllCloudinaryAssets();
    
    const [settings, companies, stories, seasonalProducts, organicProducts, techPackages] = await Promise.all([
      WebsiteSetting.findOne().lean(),
      Company.find({}).lean(),
      Story.find({}).lean(),
      SeasonalProduct.find({}).lean(),
      OrganicProduct.find({}).lean(),
      TechPackage.find({}).lean()
    ]);

    const syncPromises = assets.map(async (asset) => {
      const usageLocations = buildUsageLocations(asset, settings, companies, stories, seasonalProducts, organicProducts, techPackages);
      const primaryUsage = usageLocations[0] || {};

      const payload = {
        publicId: asset.publicId,
        secureUrl: asset.secureUrl,
        fileType: asset.fileType || inferFileType(asset.resourceType, asset.format),
        resourceType: asset.resourceType || 'unknown',
        format: asset.format || '',
        bytes: asset.bytes || 0,
        width: asset.width || 0,
        height: asset.height || 0,
        duration: asset.duration || 0,
        uploadedAt: asset.createdAt || new Date(),
        relatedModel: primaryUsage.relatedModel || '',
        relatedId: primaryUsage.relatedId || '',
        usageSection: primaryUsage.usageSection || '',
        usageLocations,
        isUsed: usageLocations.length > 0,
        lastSyncedAt: new Date()
      };

      await Media.findOneAndUpdate({ publicId: asset.publicId }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
    });

    await Promise.all(syncPromises);

    const activePublicIds = assets.map(a => a.publicId);
    await Media.deleteMany({ publicId: { $nin: activePublicIds } });

    lastSyncTime = Date.now();
    return assets.length;
  } finally {
    isSyncing = false;
  }
};

const applyFilters = async (filters) => {
  const query = {};

  if (filters.type && filters.type !== 'all') {
    query.fileType = filters.type;
  }

  if (filters.usage === 'used') {
    query.isUsed = true;
  } else if (filters.usage === 'unused') {
    query.isUsed = false;
  }

  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [
      { publicId: regex },
      { secureUrl: regex },
      { relatedModel: regex },
      { relatedId: regex },
      { usageSection: regex }
    ];
  }

  if (filters.section) {
    const escaped = filters.section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = (query.$or || []).concat([
      { usageSection: regex },
      { 'usageLocations.relatedTitle': regex }
    ]);
  }

  if (filters.dateFrom || filters.dateTo) {
    query.uploadedAt = {};
    if (filters.dateFrom) query.uploadedAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      query.uploadedAt.$lte = endDate;
    }
  }

  const sort = { uploadedAt: -1 };
  const skip = (filters.page - 1) * filters.limit;
  const [items, total, usageSummary] = await Promise.all([
    Media.find(query).sort(sort).skip(skip).limit(filters.limit).lean(),
    Media.countDocuments(query),
    Media.aggregate([
      {
        $group: {
          _id: null,
          usedCount: { $sum: { $cond: ['$isUsed', 1, 0] } },
          unusedCount: { $sum: { $cond: ['$isUsed', 0, 1] } },
          totalBytes: { $sum: '$bytes' }
        }
      }
    ])
  ]);

  return {
    items,
    total,
    usageSummary: usageSummary[0] || { usedCount: 0, unusedCount: 0, totalBytes: 0 }
  };
};

exports.index = async (req, res) => {
  try {
    const filters = req.mediaFilters;
    
    // Check if the local cache is empty
    const mediaCount = await Media.countDocuments();
    const cacheDuration = 5 * 60 * 1000; // 5 minutes
    
    if (mediaCount === 0) {
      // Force sync synchronously so we have data to display
      await syncMediaLibrary(true);
    } else if (Date.now() - lastSyncTime > cacheDuration && !isSyncing) {
      // Run sync in the background
      syncMediaLibrary().catch(err => console.error('Background sync failed:', err));
    }

    const cloudinaryUsage = await getCloudinaryUsageCached();
    const { items, total, usageSummary } = await applyFilters(filters);

    const allCounts = await Media.aggregate([
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          bytes: { $sum: '$bytes' },
          usedCount: { $sum: { $cond: ['$isUsed', 1, 0] } }
        }
      }
    ]);

    const countsByType = allCounts.reduce((accumulator, item) => {
      accumulator[item._id || 'unknown'] = item;
      return accumulator;
    }, {});

    const totalAssets = total;
    const totalStorageBytes = cloudinaryUsage?.storage?.used || usageSummary.totalBytes || 0;
    const totalStorageLimit = cloudinaryUsage?.storage?.limit || (cloudinaryUsage?.credits?.limit ? cloudinaryUsage.credits.limit * 1024 * 1024 * 1024 : 25 * 1024 * 1024 * 1024);
    const remainingStorageBytes = totalStorageLimit > 0 ? Math.max(totalStorageLimit - totalStorageBytes, 0) : 0;

    const totalBandwidthLimit = cloudinaryUsage?.bandwidth?.limit || (cloudinaryUsage?.credits?.limit ? cloudinaryUsage.credits.limit * 1024 * 1024 * 1024 : 25 * 1024 * 1024 * 1024);
    const bandwidthBytes = cloudinaryUsage?.bandwidth?.usage || 0;

    const totalPages = Math.max(1, Math.ceil(total / filters.limit));
    const [mostUsed, largestFiles, recentUploads, unusedCount] = await Promise.all([
      Media.find({ isUsed: true }).sort({ bytes: -1 }).limit(5).lean(),
      Media.find().sort({ bytes: -1 }).limit(5).lean(),
      Media.find().sort({ uploadedAt: -1 }).limit(5).lean(),
      Media.countDocuments({ isUsed: false })
    ]);

    const analytics = {
      mostUsed,
      largestFiles,
      recentUploads,
      unusedCount
    };

    res.render('admin/media/index', {
      title: 'Media Management',
      currentPage: 'media',
      adminName: req.session.adminName,
      media: items,
      pagination: { page: filters.page, limit: filters.limit, total, totalPages },
      filters,
      stats: {
        totalStorageLimit,
        totalStorageBytes,
        remainingStorageBytes,
        totalBandwidthLimit,
        bandwidthBytes,
        totalAssets,
        imageCount: countsByType.image?.count || 0,
        videoCount: countsByType.video?.count || 0,
        pdfCount: countsByType.pdf?.count || 0,
        documentCount: countsByType.document?.count || 0,
        usedCount: usageSummary.usedCount || 0,
        unusedCount: analytics.unusedCount || 0
      },
      analytics: {
        mostUsed: analytics.mostUsed,
        largestFiles: analytics.largestFiles,
        recentUploads: analytics.recentUploads
      },
      cloudinaryUsage,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Media index error:', error);
    req.flash('error', 'Unable to load media management dashboard');
    res.redirect('/admin/dashboard');
  }
};

exports.showDetail = async (req, res) => {
  try {
    const media = await Media.findOne({ publicId: req.params.publicId }).lean();
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    res.json({ success: true, media });
  } catch (error) {
    console.error('Media detail error:', error);
    res.status(500).json({ success: false, message: 'Unable to load media details' });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findOne({ publicId: req.params.publicId });
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    const hasUsage = Array.isArray(media.usageLocations) && media.usageLocations.length > 0;
    const force = req.query.force === 'true' || req.query.force === true;
    if (hasUsage && !force) {
      return res.status(409).json({
        success: false,
        used: true,
        message: 'This media is currently used in one or more places.',
        usageLocations: media.usageLocations
      });
    }

    await deleteCloudinaryAsset(media.publicId, media.resourceType || 'image');
    await Media.deleteOne({ publicId: media.publicId });

    return res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Media delete error:', error);
    res.status(500).json({ success: false, message: 'Unable to delete media' });
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    const publicIds = Array.isArray(req.body.publicIds) ? req.body.publicIds : [];
    if (!publicIds.length) {
      return res.status(400).json({ success: false, message: 'No media selected' });
    }

    const mediaItems = await Media.find({ publicId: { $in: publicIds } }).lean();
    const force = req.body.force === 'true' || req.body.force === true;
    const blocked = mediaItems.filter((item) => item.isUsed && !force);

    if (blocked.length > 0) {
      return res.status(409).json({
        success: false,
        used: true,
        message: 'Some selected media are still used by site content.',
        usageLocations: blocked.flatMap((item) => item.usageLocations || [])
      });
    }

    for (const item of mediaItems) {
      await deleteCloudinaryAsset(item.publicId, item.resourceType || 'image');
      await Media.deleteOne({ publicId: item.publicId });
    }

    return res.json({ success: true, message: `${mediaItems.length} media item(s) deleted successfully` });
  } catch (error) {
    console.error('Media bulk delete error:', error);
    res.status(500).json({ success: false, message: 'Unable to bulk delete media' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const count = await syncMediaLibrary(true);
    req.flash('success', `Synced ${count} media item(s) from Cloudinary`);
    res.redirect('/admin/media');
  } catch (error) {
    console.error('Media refresh error:', error);
    req.flash('error', 'Unable to sync media library');
    res.redirect('/admin/media');
  }
};

exports.downloadRedirect = async (req, res) => {
  try {
    const media = await Media.findOne({ publicId: req.params.publicId }).lean();
    if (!media || !media.secureUrl) {
      return res.status(404).send('Media not found');
    }
    return res.redirect(media.secureUrl);
  } catch (error) {
    console.error('Media download redirect error:', error);
    return res.status(500).send('Unable to download media');
  }
};
