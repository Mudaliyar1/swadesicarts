const WebsiteSetting = require('../models/WebsiteSetting');
const cloudinary = require('../config/cloudinary');
const { normalizeSiteUrl } = require('../helpers/siteUrl');

// ─── In-memory cache ──────────────────────────────────────────────────────────
let _settingsCache   = null;
let _policiesCache   = null;
let _cacheExpiresAt  = 0;
const CACHE_TTL_MS   = 5 * 60 * 1000; // 5 minutes

// Call this from admin controllers whenever settings or policies are saved
const invalidateSettingsCache = () => {
  _settingsCache  = null;
  _policiesCache  = null;
  _cacheExpiresAt = 0;
};

// ─── Default field migration (single save, not one save per field) ────────────
const DEFAULT_COLORS = {
  primary: '#4C1E4F',
  accent: '#B5A886',
  secondary: '#6C8E7F',
  headingText: '#2c3e50',
  bodyText: '#495057',
  linkColor: '#B5A886',
  headerFooterLinkColor: '#FFD700',
  bodyBackgroundColor: '#ffffff',
  backgroundType: 'color',
  backgroundGradient: ''
};

const migrateSettings = async (settings) => {
  let dirty = false;

  if (!settings.about) { settings.about = {}; dirty = true; }
  if (!settings.about.teamMembers) { settings.about.teamMembers = []; dirty = true; }
  if (!Array.isArray(settings.about.values) || settings.about.values.length === 0) {
    settings.about.values = [
      { icon: '🌟', title: 'Quality',       description: 'We never compromise on quality. Every product is carefully selected and tested.' },
      { icon: '✓',  title: 'Authenticity',  description: 'All products come with proper certifications and guarantees.' },
      { icon: '💙', title: 'Customer Care', description: "Your satisfaction is our priority. We're always here to help." },
      { icon: '🚀', title: 'Innovation',    description: 'We continuously improve our services and offerings.' }
    ];
    dirty = true;
  }

  if (!settings.carousel)        { settings.carousel = [];                                                   dirty = true; }
  if (!settings.carouselSection) { settings.carouselSection = { showHeader: false, heading: 'Featured Carousel', subheading: 'Updates, offers, and highlights you can control from the admin panel' }; dirty = true; }
  if (!settings.siteUrl)         { settings.siteUrl = normalizeSiteUrl();                                    dirty = true; }
  if (!settings.announcementBar) { settings.announcementBar = { enabled: false, text: '🔥 Fresh offers and updates available now', speed: 18, backgroundColor: '#2c5f2d', textColor: '#ffffff', loop: true, closeButton: true }; dirty = true; }
  if (!settings.designEditor || !Array.isArray(settings.designEditor.rules)) { settings.designEditor = { rules: [] }; dirty = true; }
  if (!settings.layout)          { settings.layout = { heroPaddingTop: 100, heroPaddingBottom: 100 };        dirty = true; }

  if (!settings.colors) {
    settings.colors = { ...DEFAULT_COLORS };
    dirty = true;
  } else {
    // Patch individual missing color fields
    for (const [key, val] of Object.entries(DEFAULT_COLORS)) {
      if (!settings.colors[key]) { settings.colors[key] = val; dirty = true; }
    }
  }

  if (dirty) {
    await settings.save();
  }

  return settings;
};

// ─── Apply Cloudinary URL transforms (in-memory only, no DB write) ───────────
const applyCarouselTransforms = (settings) => {
  try {
    if (settings && Array.isArray(settings.carousel)) {
      settings.carousel.forEach(item => {
        try {
          if (item.media && item.media.publicId) {
            const resourceType = item.media.type === 'video' ? 'video' : 'image';
            item.media.transformedUrl = cloudinary.url(item.media.publicId, {
              resource_type: resourceType,
              width: 1600,
              quality: 'auto',
              fetch_format: 'auto',
              dpr: 'auto'
            });
          }
        } catch (_) {
          item.media.transformedUrl = item.media.url || '';
        }
      });
    }
  } catch (_) {
    // ignore
  }
};

// ─── Middleware ───────────────────────────────────────────────────────────────
const loadWebsiteSettings = async (req, res, next) => {
  const now = Date.now();

  // Serve from cache if still fresh
  if (_settingsCache && now < _cacheExpiresAt) {
    res.locals.siteSettings   = _settingsCache;
    res.locals.activePolicies = _policiesCache || [];
    return next();
  }

  try {
    let settings = await WebsiteSetting.findOne().lean({ virtuals: false });

    if (!settings) {
      // Create default document — use a non-lean model so .save() works
      const newSettings = new WebsiteSetting({ about: { teamMembers: [] } });
      await newSettings.save();
      settings = newSettings.toObject();
    }

    // Run migrations — wrap in a full model instance so save() is available
    const settingsDoc = await WebsiteSetting.findById(settings._id);
    await migrateSettings(settingsDoc);

    // Get the plain object for caching & view locals
    const plain = settingsDoc.toObject({ virtuals: false });
    applyCarouselTransforms(plain);

    // Fetch active policies
    const Policy = require('../models/Policy');
    let activePolicies = [];
    try {
      activePolicies = await Policy.find({ status: 'published' }).select('title slug').sort({ title: 1 }).lean();
    } catch (_) {
      // non-fatal
    }

    // Store in cache
    _settingsCache  = plain;
    _policiesCache  = activePolicies;
    _cacheExpiresAt = now + CACHE_TTL_MS;

    res.locals.siteSettings   = plain;
    res.locals.activePolicies = activePolicies;
    next();

  } catch (error) {
    console.error('Error loading website settings:', error.message);
    res.locals.siteSettings   = null;
    res.locals.activePolicies = [];
    next();
  }
};

module.exports = { loadWebsiteSettings, invalidateSettingsCache };
