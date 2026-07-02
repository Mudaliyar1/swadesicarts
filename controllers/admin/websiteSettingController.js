const WebsiteSetting = require('../../models/WebsiteSetting');
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');
const { normalizeSiteUrl } = require('../../helpers/siteUrl');
const { invalidateSettingsCache } = require('../../middleware/websiteSettings');

const buildDefaultDesignEditor = () => ({ rules: [] });

const editorPreviewPages = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Seasonal Products', path: '/seasonal-products' },
  { label: 'Tech Packages', path: '/tech-packages' },
  { label: 'Organic Products', path: '/organic-products' }
];

const normalizeEditorRule = (rule) => {
  if (!rule || typeof rule !== 'object') return null;

  const selector = typeof rule.selector === 'string' ? rule.selector.trim() : '';
  if (!selector) return null;

  const styles = rule.styles && typeof rule.styles === 'object' ? rule.styles : {};
  const inferredTextMode = styles.textMode || (styles.textGradientStart && styles.textGradientEnd ? 'gradient' : 'color');
  const inferredBackgroundMode = styles.backgroundMode || (styles.backgroundGradientStart && styles.backgroundGradientEnd ? 'gradient' : (styles.backgroundColor ? 'color' : 'none'));

  return {
    selector,
    styles: {
      color: styles.color || '',
      backgroundColor: styles.backgroundColor || '',
      textMode: inferredTextMode,
      textGradientStart: styles.textGradientStart || '',
      textGradientEnd: styles.textGradientEnd || '',
      textGradientDirection: styles.textGradientDirection || '135deg',
      backgroundMode: inferredBackgroundMode,
      backgroundGradientStart: styles.backgroundGradientStart || '',
      backgroundGradientEnd: styles.backgroundGradientEnd || '',
      backgroundGradientDirection: styles.backgroundGradientDirection || '135deg',
      borderRadius: styles.borderRadius || '',
      fontSize: styles.fontSize || '',
      fontFamily: styles.fontFamily || '',
      fontWeight: styles.fontWeight || '',
      fontStyle: styles.fontStyle || '',
      lineHeight: styles.lineHeight || '',
      letterSpacing: styles.letterSpacing || ''
    }
  };
};

const normalizePreviewPath = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '/';
  const trimmed = value.trim();
  return trimmed.startsWith('/') ? trimmed : '/';
};

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const normalizeBoolean = (value) => value === 'true' || value === 'on' || value === true;

const buildRobotsTxt = (siteUrl) => `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

Disallow: /admin/
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /dashboard
Disallow: /api/visitor

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml
`;

const persistRobotsTxt = (siteUrl) => {
  try {
    const robotsPath = path.join(__dirname, '../../public/robots.txt');
    fs.writeFileSync(robotsPath, buildRobotsTxt(siteUrl), 'utf8');
  } catch (error) {
    console.error('Error updating robots.txt:', error);
  }
};

// Get or create website settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new WebsiteSetting({
        about: {
          teamMembers: [],
          values: [
            {
              icon: 'ðŸŒŸ',
              title: 'Quality',
              description: 'We never compromise on quality. Every product is carefully selected and tested.'
            },
            {
              icon: 'âœ“',
              title: 'Authenticity',
              description: 'All products come with proper certifications and guarantees.'
            },
            {
              icon: 'ðŸ’™',
              title: 'Customer Care',
              description: 'Your satisfaction is our priority. We\'re always here to help.'
            },
            {
              icon: 'ðŸš€',
              title: 'Innovation',
              description: 'We continuously improve our services and offerings.'
            }
          ]
        }
      });
      await settings.save(); invalidateSettingsCache();
    }

    // Ensure teamMembers array exists
    if (!settings.about.teamMembers) {
      settings.about.teamMembers = [];
      await settings.save(); invalidateSettingsCache();
    }

    if (!settings.carousel) {
      settings.carousel = [];
      await settings.save(); invalidateSettingsCache();
    }

    if (!settings.siteUrl) {
      settings.siteUrl = normalizeSiteUrl();
      await settings.save(); invalidateSettingsCache();
    }

    if (!settings.announcementBar) {
      settings.announcementBar = {
        enabled: false,
        text: 'ðŸ”¥ Fresh offers and updates available now',
        speed: 18,
        backgroundColor: '#2c5f2d',
        textColor: '#ffffff',
        loop: true,
        closeButton: true
      };
      await settings.save(); invalidateSettingsCache();
    }

    // Ensure layout exists with defaults
    if (!settings.layout) {
      settings.layout = {
        heroPaddingTop: 100,
        heroPaddingBottom: 100
      };
      await settings.save(); invalidateSettingsCache();
    }

    // Ensure colors exist with defaults
    if (!settings.colors) {
      settings.colors = {
        primary: '#4C1E4F',
        accent: '#B5A886',
        secondary: '#6C8E7F',
        headingText: '#2c3e50',
        bodyText: '#495057',
        linkColor: '#B5A886',
        headerFooterLinkColor: '#FFD700'
      };
      await settings.save(); invalidateSettingsCache();
    } else {
      // Ensure text colors exist in existing color objects
      if (!settings.colors.headingText) {
        settings.colors.headingText = '#2c3e50';
        await settings.save(); invalidateSettingsCache();
      }
      if (!settings.colors.bodyText) {
        settings.colors.bodyText = '#495057';
        await settings.save(); invalidateSettingsCache();
      }
      if (!settings.colors.linkColor) {
        settings.colors.linkColor = '#B5A886';
        await settings.save(); invalidateSettingsCache();
      }
      if (!settings.colors.headerFooterLinkColor) {
        settings.colors.headerFooterLinkColor = '#FFD700';
        await settings.save(); invalidateSettingsCache();
      }
    }

    res.render('admin/settings/edit', {
      title: 'Website Settings',
      settings,
      currentPage: 'settings',
      adminName: req.session.adminName,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    req.flash('error', 'Error loading settings');
    res.redirect('/admin/dashboard');
  }
};

exports.getSiteEditor = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();

    if (!settings) {
      settings = new WebsiteSetting({
        designEditor: buildDefaultDesignEditor()
      });
      await settings.save(); invalidateSettingsCache();
    }

    if (!settings.designEditor) {
      settings.designEditor = buildDefaultDesignEditor();
      await settings.save(); invalidateSettingsCache();
    }

    if (!Array.isArray(settings.designEditor.rules)) {
      settings.designEditor.rules = [];
      await settings.save(); invalidateSettingsCache();
    }

    const selectedPage = normalizePreviewPath(req.query.page || '/');

    res.render('admin/site-editor', {
      title: 'Website Editor',
      settings,
      currentPage: 'site-editor',
      adminName: req.session.adminName,
      previewPages: editorPreviewPages,
      selectedPage,
      rulesJson: JSON.stringify(settings.designEditor.rules || []),
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error loading site editor:', error);
    req.flash('error', 'Error loading website editor');
    res.redirect('/admin/dashboard');
  }
};

exports.saveSiteEditor = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();
    if (!settings) {
      settings = new WebsiteSetting();
    }

    let parsedRules = [];
    if (typeof req.body.rulesJson === 'string' && req.body.rulesJson.trim()) {
      try {
        const candidateRules = JSON.parse(req.body.rulesJson);
        if (Array.isArray(candidateRules)) {
          parsedRules = candidateRules.map(normalizeEditorRule).filter(Boolean);
        }
      } catch (parseError) {
        console.error('Invalid site editor rules JSON:', parseError);
        req.flash('error', 'Could not save editor styles because the rule data was invalid');
        return res.redirect(`/admin/site-editor?page=${encodeURIComponent(normalizePreviewPath(req.body.previewPage || '/'))}`);
      }
    }

    settings.designEditor = settings.designEditor || buildDefaultDesignEditor();
    settings.designEditor.rules = parsedRules;
    await settings.save(); invalidateSettingsCache();

    req.flash('success', 'Website editor styles saved successfully');
    res.redirect(`/admin/site-editor?page=${encodeURIComponent(normalizePreviewPath(req.body.previewPage || '/'))}`);
  } catch (error) {
    console.error('Error saving site editor:', error);
    req.flash('error', 'Error saving website editor styles: ' + error.message);
    res.redirect(`/admin/site-editor?page=${encodeURIComponent(normalizePreviewPath(req.body.previewPage || '/'))}`);
  }
};

exports.resetSiteEditor = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();
    if (!settings) {
      settings = new WebsiteSetting();
    }

    // Clear all design editor rules to restore default theme
    settings.designEditor = buildDefaultDesignEditor();
    await settings.save(); invalidateSettingsCache();

    req.flash('success', 'Website has been reset to default theme');
    res.redirect('/admin/site-editor');
  } catch (error) {
    console.error('Error resetting site editor:', error);
    req.flash('error', 'Error resetting website theme: ' + error.message);
    res.redirect('/admin/site-editor');
  }
};

exports.getCarousel = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();

    if (!settings) {
      settings = new WebsiteSetting({ carousel: [] });
      await settings.save(); invalidateSettingsCache();
    }

    if (!settings.carousel) {
      settings.carousel = [];
      await settings.save(); invalidateSettingsCache();
    }

    const editId = req.query.edit || '';
    const editItem = editId ? settings.carousel.id(editId) : null;

    res.render('admin/settings/carousel', {
      title: 'Website Carousel',
      settings,
      carouselEditItem: editItem,
      currentPage: 'settings',
      adminName: req.session.adminName,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error fetching carousel:', error);
    req.flash('error', 'Error loading carousel');
    res.redirect('/admin/settings');
  }
};

exports.addCarouselItem = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      req.flash('error', 'Settings not found');
      return res.redirect('/admin/settings/carousel');
    }

    const { title, description, linkText, linkUrl, order, textLeft, textTop, boxBgColor, textColor, linkColor, linkBgColor, titleFontSize, descFontSize } = req.body;

    if (!req.files || !req.files.media || !req.files.media[0]) {
      req.flash('error', 'Please upload a media file for the carousel item');
      return res.redirect('/admin/settings/carousel');
    }

    const file = req.files.media[0];
    const result = await uploadToCloudinary(file.buffer, 'swadesi-carts/settings/carousel');
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

    settings.carousel.push({
      title: title || '',
      description: description || '',
      linkText: linkText || '',
      linkUrl: linkUrl || '',
      textPosition: {
        left: Number.parseInt(textLeft, 10) || 50,
        top: Number.parseInt(textTop, 10) || 50
      },
      media: {
        url: result.secure_url,
        publicId: result.public_id,
        type: mediaType
      },
      order: parseInt(order) || 0,
      isActive: normalizeBoolean(req.body.isActive),
      boxBgColor: boxBgColor || 'rgba(0, 0, 0, 0.55)',
      textColor: textColor || '#ffffff',
      linkColor: linkColor || '#ffffff',
      linkBgColor: linkBgColor || 'var(--primary)',
      titleFontSize: titleFontSize || '2.5rem',
      descFontSize: descFontSize || '1.25rem'
    });

    await settings.save(); invalidateSettingsCache();
    req.flash('success', 'Carousel item added successfully');
    res.redirect('/admin/settings/carousel');
  } catch (error) {
    console.error('Error adding carousel item:', error);
    req.flash('error', 'Error adding carousel item: ' + error.message);
    res.redirect('/admin/settings/carousel');
  }
};

exports.updateCarouselItem = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      req.flash('error', 'Settings not found');
      return res.redirect('/admin/settings/carousel');
    }

    const item = settings.carousel.id(req.params.id);
    if (!item) {
      req.flash('error', 'Carousel item not found');
      return res.redirect('/admin/settings/carousel');
    }

    const { title, description, linkText, linkUrl, order, textLeft, textTop, boxBgColor, textColor, linkColor, linkBgColor, titleFontSize, descFontSize } = req.body;

    item.title = title || '';
    item.description = description || '';
    item.linkText = linkText || '';
    item.linkUrl = linkUrl || '';
    item.order = parseInt(order) || 0;
    item.isActive = normalizeBoolean(req.body.isActive);
    item.textPosition = {
      left: Number.parseInt(textLeft, 10) || item.textPosition?.left || 50,
      top: Number.parseInt(textTop, 10) || item.textPosition?.top || 50
    };
    if (boxBgColor) item.boxBgColor = boxBgColor;
    if (textColor) item.textColor = textColor;
    if (linkColor) item.linkColor = linkColor;
    if (linkBgColor) item.linkBgColor = linkBgColor;
    if (titleFontSize) item.titleFontSize = titleFontSize;
    if (descFontSize) item.descFontSize = descFontSize;

    if (req.files && req.files.media && req.files.media[0]) {
      if (item.media && item.media.publicId) {
        await cloudinary.uploader.destroy(item.media.publicId, {
          resource_type: item.media.type === 'video' ? 'video' : 'image'
        });
      }

      const file = req.files.media[0];
      const result = await uploadToCloudinary(file.buffer, 'swadesi-carts/settings/carousel');
      item.media = {
        url: result.secure_url,
        publicId: result.public_id,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image'
      };
    }

    await settings.save(); invalidateSettingsCache();
    req.flash('success', 'Carousel item updated successfully');
    res.redirect('/admin/settings/carousel');
  } catch (error) {
    console.error('Error updating carousel item:', error);
    req.flash('error', 'Error updating carousel item: ' + error.message);
    res.redirect('/admin/settings/carousel');
  }
};

exports.deleteCarouselItem = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    const item = settings.carousel.id(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Carousel item not found' });
    }

    if (item.media && item.media.publicId) {
      await cloudinary.uploader.destroy(item.media.publicId, {
        resource_type: item.media.type === 'video' ? 'video' : 'image'
      });
    }

    settings.carousel.pull(req.params.id);
    await settings.save(); invalidateSettingsCache();

    return res.status(200).json({ success: true, message: 'Carousel item deleted successfully' });
  } catch (error) {
    console.error('Error deleting carousel item:', error);
    return res.status(500).json({ success: false, message: 'Error deleting carousel item' });
  }
};

// Update website settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();
    if (!settings) {
      settings = new WebsiteSetting();
    }

    // Update footer settings
    settings.footer = {
      phone: req.body['footer.phone'] || settings.footer.phone,
      email: req.body['footer.email'] || settings.footer.email,
      address: req.body['footer.address'] || settings.footer.address,
      description: req.body['footer.description'] || settings.footer.description
    };

    // Update contact settings
    settings.contact = {
      heading: req.body['contact.heading'] || settings.contact.heading,
      subheading: req.body['contact.subheading'] || settings.contact.subheading,
      location: req.body['contact.location'] || settings.contact.location,
      email: req.body['contact.email'] || settings.contact.email,
      phone: req.body['contact.phone'] || settings.contact.phone,
      businessHours: {
        days: req.body['contact.businessHours.days'] || settings.contact.businessHours.days,
        time: req.body['contact.businessHours.time'] || settings.contact.businessHours.time
      }
    };

    // Update WhatsApp settings
    const currentWhatsapp = settings.whatsapp || {};
    settings.whatsapp = {
      number: req.body['whatsapp.number'] || currentWhatsapp.number || '',
      message: req.body['whatsapp.message'] || currentWhatsapp.message || ''
    };

    // Update Visitor Modal settings
    settings.visitorModal = {
      enabled: req.body['visitorModal.enabled'] === 'true' || req.body['visitorModal.enabled'] === 'on'
    };

    // Update social media links - preserve existing values
    const currentSocialMedia = settings.socialMedia || {};
    settings.socialMedia = {
      facebook: req.body['socialMedia.facebook'] || (req.body.socialMedia && req.body.socialMedia.facebook) || currentSocialMedia.facebook || '',
      twitter: req.body['socialMedia.twitter'] || (req.body.socialMedia && req.body.socialMedia.twitter) || currentSocialMedia.twitter || '',
      instagram: req.body['socialMedia.instagram'] || (req.body.socialMedia && req.body.socialMedia.instagram) || currentSocialMedia.instagram || '',
      linkedin: req.body['socialMedia.linkedin'] || (req.body.socialMedia && req.body.socialMedia.linkedin) || currentSocialMedia.linkedin || '',
      youtube: req.body['socialMedia.youtube'] || (req.body.socialMedia && req.body.socialMedia.youtube) || currentSocialMedia.youtube || ''
    };

    // Update about settings
    settings.about.mainHeading = req.body['about.mainHeading'] || (req.body.about && req.body.about.mainHeading) || settings.about.mainHeading;
    settings.about.headerDescription = req.body['about.headerDescription'] || (req.body.about && req.body.about.headerDescription) || settings.about.headerDescription;
    settings.about.description = req.body['about.description'] || (req.body.about && req.body.about.description) || settings.about.description;
    settings.about.valuesHeading = req.body['about.valuesHeading'] || (req.body.about && req.body.about.valuesHeading) || settings.about.valuesHeading;
    settings.about.valuesSubheading = req.body['about.valuesSubheading'] || (req.body.about && req.body.about.valuesSubheading) || settings.about.valuesSubheading;
    settings.about.ctaHeading = req.body['about.ctaHeading'] || (req.body.about && req.body.about.ctaHeading) || settings.about.ctaHeading;
    settings.about.ctaDescription = req.body['about.ctaDescription'] || (req.body.about && req.body.about.ctaDescription) || settings.about.ctaDescription;
    settings.about.teamHeading = req.body['about.teamHeading'] || (req.body.about && req.body.about.teamHeading) || settings.about.teamHeading;
    settings.about.teamSubheading = req.body['about.teamSubheading'] || (req.body.about && req.body.about.teamSubheading) || settings.about.teamSubheading;

    // Update values
    if (req.body.values) {
      const valuesArray = Array.isArray(req.body.values)
        ? req.body.values
        : Object.values(req.body.values);

      settings.about.values = valuesArray.map(value => ({
        icon: value.icon || 'ðŸŒŸ',
        title: value.title || '',
        description: value.description || ''
      }));
    } else {
      settings.about.values = [];
    }

    // Update statistics
    const currentStats = settings.about.stats || {};
    settings.about.stats = {
      customers: req.body['stats.customers'] || (req.body.stats && req.body.stats.customers) || currentStats.customers || '500+',
      customersLabel: req.body['stats.customersLabel'] || (req.body.stats && req.body.stats.customersLabel) || currentStats.customersLabel || 'Happy Customers',
      products: req.body['stats.products'] || (req.body.stats && req.body.stats.products) || currentStats.products || '1000+',
      productsLabel: req.body['stats.productsLabel'] || (req.body.stats && req.body.stats.productsLabel) || currentStats.productsLabel || 'Products & Services',
      experience: req.body['stats.experience'] || (req.body.stats && req.body.stats.experience) || currentStats.experience || '10+',
      experienceLabel: req.body['stats.experienceLabel'] || (req.body.stats && req.body.stats.experienceLabel) || currentStats.experienceLabel || 'Years Experience',
      satisfaction: req.body['stats.satisfaction'] || (req.body.stats && req.body.stats.satisfaction) || currentStats.satisfaction || '100%',
      satisfactionLabel: req.body['stats.satisfactionLabel'] || (req.body.stats && req.body.stats.satisfactionLabel) || currentStats.satisfactionLabel || 'Satisfaction Guaranteed'
    };

    // Handle logo upload
    if (req.files && req.files.logo && req.files.logo[0]) {
      // Delete old logo if exists
      if (settings.logo.publicId) {
        await cloudinary.uploader.destroy(settings.logo.publicId);
      }

      const result = await uploadToCloudinary(req.files.logo[0].buffer, 'swadesi-carts/settings');

      settings.logo.url = result.secure_url;
      settings.logo.publicId = result.public_id;
    }

    // Update logo size and position settings (Global)
    if (req.body['logo.width']) {
      settings.logo.width = parseInt(req.body['logo.width']) || 200;
    }
    if (req.body['logo.height']) {
      settings.logo.height = parseInt(req.body['logo.height']) || 50;
    }
    if (req.body['logo.horizontalPosition']) {
      settings.logo.horizontalPosition = parseInt(req.body['logo.horizontalPosition']) || 0;
    }
    if (req.body['logo.verticalPosition']) {
      settings.logo.verticalPosition = parseInt(req.body['logo.verticalPosition']) || 0;
    }

    // Desktop overrides
    if (!settings.logo.desktop) settings.logo.desktop = {};
    if (req.body['logo.desktop.width']) settings.logo.desktop.width = parseInt(req.body['logo.desktop.width']) || 200;
    if (req.body['logo.desktop.height']) settings.logo.desktop.height = parseInt(req.body['logo.desktop.height']) || 50;
    if (req.body['logo.desktop.horizontalPosition'] !== undefined) settings.logo.desktop.horizontalPosition = parseInt(req.body['logo.desktop.horizontalPosition']) || 0;
    if (req.body['logo.desktop.verticalPosition'] !== undefined) settings.logo.desktop.verticalPosition = parseInt(req.body['logo.desktop.verticalPosition']) || 0;

    // Mobile overrides
    if (!settings.logo.mobile) settings.logo.mobile = {};
    if (req.body['logo.mobile.width']) settings.logo.mobile.width = parseInt(req.body['logo.mobile.width']) || 150;
    if (req.body['logo.mobile.height']) settings.logo.mobile.height = parseInt(req.body['logo.mobile.height']) || 40;
    if (req.body['logo.mobile.horizontalPosition'] !== undefined) settings.logo.mobile.horizontalPosition = parseInt(req.body['logo.mobile.horizontalPosition']) || 0;
    if (req.body['logo.mobile.verticalPosition'] !== undefined) settings.logo.mobile.verticalPosition = parseInt(req.body['logo.mobile.verticalPosition']) || 0;

    // Update header settings
    if (req.body['header.height']) {
      settings.header.height = parseInt(req.body['header.height']) || 72;
    }
    if (req.body['header.desktopHeight']) {
      settings.header.desktopHeight = parseInt(req.body['header.desktopHeight']) || 72;
    }
    if (req.body['header.mobileHeight']) {
      settings.header.mobileHeight = parseInt(req.body['header.mobileHeight']) || 60;
    }

    // Update site URL / domain
    if (typeof req.body.siteUrl !== 'undefined') {
      const normalizedSiteUrl = normalizeSiteUrl(req.body.siteUrl);
      if (normalizedSiteUrl) {
        settings.siteUrl = normalizedSiteUrl;
      }
    }

    // Update announcement bar settings
    const currentAnnouncementBar = settings.announcementBar || {};
    settings.announcementBar = {
      enabled: req.body['announcementBar.enabled'] === 'on' || req.body['announcementBar.enabled'] === 'true',
      text: req.body['announcementBar.text'] || currentAnnouncementBar.text || 'ðŸ”¥ Fresh offers and updates available now',
      speed: parseInt(req.body['announcementBar.speed'], 10) || currentAnnouncementBar.speed || 18,
      backgroundColor: req.body['announcementBar.backgroundColor'] || currentAnnouncementBar.backgroundColor || '#2c5f2d',
      textColor: req.body['announcementBar.textColor'] || currentAnnouncementBar.textColor || '#ffffff',
      loop: req.body['announcementBar.loop'] === 'on' || req.body['announcementBar.loop'] === 'true',
      closeButton: req.body['announcementBar.closeButton'] === 'on' || req.body['announcementBar.closeButton'] === 'true'
    };

    // Update color scheme
    if (req.body['colors.primary']) {
      settings.colors.primary = req.body['colors.primary'];
    }
    if (req.body['colors.accent']) {
      settings.colors.accent = req.body['colors.accent'];
    }
    if (req.body['colors.secondary']) {
      settings.colors.secondary = req.body['colors.secondary'];
    }
    if (req.body['colors.headingText']) {
      settings.colors.headingText = req.body['colors.headingText'];
    }
    if (req.body['colors.bodyText']) {
      settings.colors.bodyText = req.body['colors.bodyText'];
    }
    if (req.body['colors.linkColor']) {
      settings.colors.linkColor = req.body['colors.linkColor'];
    }
    if (req.body['colors.headerFooterLinkColor']) {
      settings.colors.headerFooterLinkColor = req.body['colors.headerFooterLinkColor'];
    }
    // Carousel section header settings
    if (!settings.carouselSection) settings.carouselSection = {};
    settings.carouselSection.showHeader = req.body['carouselSection.showHeader'] === 'on' || req.body['carouselSection.showHeader'] === 'true';
    if (typeof req.body['carouselSection.heading'] !== 'undefined') {
      settings.carouselSection.heading = req.body['carouselSection.heading'] || settings.carouselSection.heading || 'Featured Carousel';
    }
    if (typeof req.body['carouselSection.subheading'] !== 'undefined') {
      settings.carouselSection.subheading = req.body['carouselSection.subheading'] || settings.carouselSection.subheading || 'Updates, offers, and highlights you can control from the admin panel';
    }
    if (req.body['colors.bodyBackgroundColor']) {
      settings.colors.bodyBackgroundColor = req.body['colors.bodyBackgroundColor'];
    }
    if (req.body['colors.backgroundType']) {
      settings.colors.backgroundType = req.body['colors.backgroundType'];
    }
    if (req.body['colors.backgroundGradient'] !== undefined) {
      settings.colors.backgroundGradient = req.body['colors.backgroundGradient'];
    }
    if (req.body['gradient.stop1']) {
      settings.colors.backgroundGradientStop1 = req.body['gradient.stop1'];
    }
    if (req.body['gradient.stop2']) {
      settings.colors.backgroundGradientStop2 = req.body['gradient.stop2'];
    }

    // Update typography settings
    if (!settings.typography) settings.typography = {};
    if (req.body['typography.fontFamily']) {
      settings.typography.fontFamily = req.body['typography.fontFamily'];
    }

    // Update buttons settings
    if (!settings.buttons) settings.buttons = {};
    if (req.body['buttons.borderRadius']) {
      settings.buttons.borderRadius = req.body['buttons.borderRadius'];
    }
    if (req.body['buttons.paddingX']) {
      settings.buttons.paddingX = req.body['buttons.paddingX'];
    }
    if (req.body['buttons.paddingY']) {
      settings.buttons.paddingY = req.body['buttons.paddingY'];
    }

    // Update layout settings
    if (!settings.layout) settings.layout = {};
    const heroPaddingTopRaw = req.body['layout.heroPaddingTop'] !== undefined
      ? req.body['layout.heroPaddingTop']
      : (req.body.layout && req.body.layout.heroPaddingTop);

    const heroPaddingBottomRaw = req.body['layout.heroPaddingBottom'] !== undefined
      ? req.body['layout.heroPaddingBottom']
      : (req.body.layout && req.body.layout.heroPaddingBottom);

    if (heroPaddingTopRaw !== undefined && heroPaddingTopRaw !== null && heroPaddingTopRaw !== '') {
      const val = parseInt(heroPaddingTopRaw, 10);
      settings.layout.heroPaddingTop = !isNaN(val) ? val : 100;
    }
    if (heroPaddingBottomRaw !== undefined && heroPaddingBottomRaw !== null && heroPaddingBottomRaw !== '') {
      const val = parseInt(heroPaddingBottomRaw, 10);
      settings.layout.heroPaddingBottom = !isNaN(val) ? val : 100;
    }

    // Handle about image upload
    if (req.files && req.files.aboutImage && req.files.aboutImage[0]) {
      // Delete old image if exists
      if (settings.about.image.publicId) {
        await cloudinary.uploader.destroy(settings.about.image.publicId);
      }

      const result = await uploadToCloudinary(req.files.aboutImage[0].buffer, 'swadesi-carts/settings');

      settings.about.image = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    await settings.save(); invalidateSettingsCache();
    persistRobotsTxt(settings.siteUrl || normalizeSiteUrl());

    req.flash('success', 'Website settings updated successfully');
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Error updating settings:', error);
    req.flash('error', 'Error updating settings: ' + error.message);
    res.redirect('/admin/settings');
  }
};

// Delete logo
exports.deleteLogo = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    if (settings.logo.publicId) {
      await cloudinary.uploader.destroy(settings.logo.publicId);
    }

    settings.logo.url = '';
    settings.logo.publicId = '';
    await settings.save(); invalidateSettingsCache();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return res.status(500).json({ success: false, message: 'Error deleting logo' });
  }
};

// Delete about image
exports.deleteAboutImage = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    if (settings.about.image.publicId) {
      await cloudinary.uploader.destroy(settings.about.image.publicId);
    }

    settings.about.image.url = '';
    settings.about.image.publicId = '';
    await settings.save(); invalidateSettingsCache();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting about image:', error);
    return res.status(500).json({ success: false, message: 'Error deleting about image' });
  }
};

// Team Members Management
exports.addTeamMember = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    const { name, role, bio } = req.body;
    let imageUrl = '';
    let imagePublicId = '';

    // Upload image if provided
    if (req.files && req.files.image && req.files.image[0]) {
      const result = await uploadToCloudinary(req.files.image[0].buffer, 'team-members');
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const newMember = {
      name,
      role,
      bio: bio || '',
      image: {
        url: imageUrl,
        publicId: imagePublicId
      },
      isActive: true,
      order: settings.about.teamMembers.length
    };

    settings.about.teamMembers.push(newMember);
    await settings.save(); invalidateSettingsCache();

    req.flash('success', 'Team member added successfully');
    res.redirect('/admin/settings/team');
  } catch (error) {
    console.error('Error adding team member:', error);
    req.flash('error', 'Error adding team member: ' + error.message);
    res.redirect('/admin/settings/team');
  }
};

exports.updateTeamMember = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    const memberId = req.params.id;
    const { name, role, bio, isActive } = req.body;

    const member = settings.about.teamMembers.id(memberId);
    if (!member) {
      req.flash('error', 'Team member not found');
      return res.redirect('/admin/settings/team');
    }

    member.name = name;
    member.role = role;
    member.bio = bio || '';
    member.isActive = isActive === 'true' || isActive === 'on';

    // Upload new image if provided
    if (req.files && req.files.image && req.files.image[0]) {
      // Delete old image
      if (member.image.publicId) {
        await cloudinary.uploader.destroy(member.image.publicId);
      }

      const result = await uploadToCloudinary(req.files.image[0].buffer, 'team-members');
      member.image.url = result.secure_url;
      member.image.publicId = result.public_id;
    }

    await settings.save(); invalidateSettingsCache();

    req.flash('success', 'Team member updated successfully');
    res.redirect('/admin/settings/team');
  } catch (error) {
    console.error('Error updating team member:', error);
    req.flash('error', 'Error updating team member: ' + error.message);
    res.redirect('/admin/settings/team');
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    const memberId = req.params.id;
    const member = settings.about.teamMembers.id(memberId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    // Delete image from cloudinary
    if (member.image.publicId) {
      await cloudinary.uploader.destroy(member.image.publicId);
    }

    settings.about.teamMembers.pull(memberId);
    await settings.save(); invalidateSettingsCache();

    return res.status(200).json({ success: true, message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return res.status(500).json({ success: false, message: 'Error deleting team member' });
  }
};

exports.getTeamMembers = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new WebsiteSetting({
        about: {
          teamMembers: [],
          values: [
            {
              icon: 'ðŸŒŸ',
              title: 'Quality',
              description: 'We never compromise on quality. Every product is carefully selected and tested.'
            },
            {
              icon: 'âœ“',
              title: 'Authenticity',
              description: 'All products come with proper certifications and guarantees.'
            },
            {
              icon: 'ðŸ’™',
              title: 'Customer Care',
              description: 'Your satisfaction is our priority. We\'re always here to help.'
            },
            {
              icon: 'ðŸš€',
              title: 'Innovation',
              description: 'We continuously improve our services and offerings.'
            }
          ]
        }
      });
      await settings.save(); invalidateSettingsCache();
    }

    // Ensure teamMembers array exists
    if (!settings.about.teamMembers) {
      settings.about.teamMembers = [];
      await settings.save(); invalidateSettingsCache();
    }

    res.render('admin/settings/team', {
      title: 'Team Members',
      settings,
      currentPage: 'settings',
      adminName: req.session.adminName,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    req.flash('error', 'Error loading team members');
    res.redirect('/admin/settings');
  }
};

