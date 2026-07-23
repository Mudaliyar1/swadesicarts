const Admin = require('../../models/Admin');

// List all admins
exports.list = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    
    res.render('admin/admins/list', {
      title: 'Admin Management',
      admins,
      adminName: req.session.adminName,
      currentPage: 'admins',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).send('Server Error');
  }
};

// Show create form
exports.showCreate = (req, res) => {
  res.render('admin/admins/create', {
    title: 'Add Admin User',
    adminName: req.session.adminName,
    currentPage: 'admins',
    error: req.flash('error')
  });
};

// Create admin
exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      req.flash('error', 'Email already exists');
      return res.redirect('/admin/admins/create');
    }

    await Admin.create({
      name,
      email,
      password,
      role: role || 'admin'
    });

    req.flash('success', 'Admin user created successfully');
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Create error:', error);
    req.flash('error', 'An error occurred while creating the admin');
    res.redirect('/admin/admins/create');
  }
};

// Show edit form
exports.showEdit = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    
    if (!admin) {
      req.flash('error', 'Admin not found');
      return res.redirect('/admin/admins');
    }

    res.render('admin/admins/edit', {
      title: 'Edit Admin User',
      admin,
      adminName: req.session.adminName,
      currentPage: 'admins',
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Show edit error:', error);
    req.flash('error', 'An error occurred');
    res.redirect('/admin/admins');
  }
};

// Update admin
exports.update = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      req.flash('error', 'Admin not found');
      return res.redirect('/admin/admins');
    }

    // Check if email is taken by another admin
    if (email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        req.flash('error', 'Email already taken');
        return res.redirect(`/admin/admins/edit/${req.params.id}`);
      }
    }

    admin.name = name;
    admin.email = email;
    admin.role = role || 'admin';
    
    if (password && password.trim()) {
      admin.password = password;
    }

    await admin.save();

    req.flash('success', 'Admin user updated successfully');
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Update error:', error);
    req.flash('error', 'An error occurred while updating the admin');
    res.redirect(`/admin/admins/edit/${req.params.id}`);
  }
};

// Delete admin
exports.delete = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Prevent deleting current admin
    if (admin._id.toString() === req.session.adminId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the admin' });
  }
};

// GET /admin/seo-geo
exports.getSeoGeoDashboard = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const SeasonalProduct = require('../../models/SeasonalProduct');
    const TechPackage = require('../../models/TechPackage');
    const OrganicProduct = require('../../models/OrganicProduct');
    const Policy = require('../../models/Policy');

    const [organic, seasonal, tech, policies] = await Promise.all([
      OrganicProduct.find().lean(),
      SeasonalProduct.find().lean(),
      TechPackage.find().lean(),
      Policy.find().lean()
    ]);

    // Track completed vs total SEO & GEO fields
    let totalSeoFields = 0;
    let filledSeoFields = 0;
    let totalGeoFields = 0;
    let filledGeoFields = 0;

    const analyzeItem = (p, type) => {
      // SEO Check
      const titleVal = p.seoTitle || '';
      const descVal = type === 'policy' ? (p.seoDescription || '') : (p.seoMetaDescription || '');
      const keysVal = p.seoKeywords || '';

      totalSeoFields += 3;
      if (titleVal.trim()) filledSeoFields++;
      if (descVal.trim()) filledSeoFields++;
      if (keysVal.trim()) filledSeoFields++;

      // GEO Check
      const geoSummary = p.geoSummary || '';
      const aiDescription = p.aiDescription || '';
      const aiKeywords = p.aiKeywords || p.geoKeywords || p.aiSearchKeywords || '';
      const entityDescription = p.entityDescription || '';

      totalGeoFields += 4;
      if (geoSummary.trim()) filledGeoFields++;
      if (aiDescription.trim()) filledGeoFields++;
      if (aiKeywords.trim()) filledGeoFields++;
      if (entityDescription.trim()) filledGeoFields++;

      const isMissingSeo = !titleVal.trim() || !descVal.trim() || !keysVal.trim();
      const isMissingGeo = !geoSummary.trim() || !aiDescription.trim() || !aiKeywords.trim() || !entityDescription.trim();

      return {
        id: p._id,
        title: p.title,
        type,
        slug: p.slug,
        isMissingSeo,
        isMissingGeo,
        editUrl: type === 'policy' ? `/admin/policies/edit-by-slug/${p.slug}` : `/admin/${type === 'organic' ? 'organic-products' : type === 'seasonal' ? 'seasonal-products' : 'tech-packages'}/edit/${p._id}`
      };
    };

    const organicAnalyzed = organic.map(p => analyzeItem(p, 'organic'));
    const seasonalAnalyzed = seasonal.map(p => analyzeItem(p, 'seasonal'));
    const techAnalyzed = tech.map(p => analyzeItem(p, 'tech'));
    const policiesAnalyzed = policies.map(p => analyzeItem(p, 'policy'));

    const seoScore = totalSeoFields > 0 ? Math.round((filledSeoFields / totalSeoFields) * 100) : 100;
    const geoScore = totalGeoFields > 0 ? Math.round((filledGeoFields / totalGeoFields) * 100) : 100;

    const countMissingSeo = (list) => list.filter(p => p.isMissingSeo).length;
    const countMissingGeo = (list) => list.filter(p => p.isMissingGeo).length;

    const stats = {
      organicTotal: organic.length,
      organicMissingGeo: countMissingGeo(organicAnalyzed),
      organicMissingSeo: countMissingSeo(organicAnalyzed),

      seasonalTotal: seasonal.length,
      seasonalMissingGeo: countMissingGeo(seasonalAnalyzed),
      seasonalMissingSeo: countMissingSeo(seasonalAnalyzed),

      techTotal: tech.length,
      techMissingGeo: countMissingGeo(techAnalyzed),
      techMissingSeo: countMissingSeo(techAnalyzed),

      policyTotal: policies.length,
      policyMissingGeo: countMissingGeo(policiesAnalyzed),
      policyMissingSeo: countMissingSeo(policiesAnalyzed),

      seoScore,
      geoScore
    };

    stats.totalProducts = stats.organicTotal + stats.seasonalTotal + stats.techTotal + stats.policyTotal;
    stats.totalMissingGeo = stats.organicMissingGeo + stats.seasonalMissingGeo + stats.techMissingGeo + stats.policyMissingGeo;
    stats.totalMissingSeo = stats.organicMissingSeo + stats.seasonalMissingSeo + stats.techMissingSeo + stats.policyMissingSeo;

    const allItems = [
      ...organicAnalyzed,
      ...seasonalAnalyzed,
      ...techAnalyzed,
      ...policiesAnalyzed
    ];

    let reportData = null;
    const reportPath = path.join(__dirname, '../../public/seo-geo-intelligence-report.json');
    if (fs.existsSync(reportPath)) {
      try {
        reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch (e) {
        console.error('Failed to parse seo-geo-intelligence-report.json:', e);
      }
    }

    res.render('admin/geo/seo-geo-dashboard', {
      title: 'SEO & GEO Optimization Hub',
      stats,
      products: allItems,
      reportData,
      adminName: req.session.adminName,
      currentPage: 'seo-geo',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('SEO & GEO Dashboard error:', error);
    res.status(500).send('Server Error');
  }
};

// GET /admin/geo (Alias Redirect)
exports.getGeoDashboard = (req, res) => {
  res.redirect(301, '/admin/seo-geo');
};

// POST /admin/geo/bulk-generate
exports.bulkGenerateGeo = async (req, res) => {
  try {
    const SeasonalProduct = require('../../models/SeasonalProduct');
    const TechPackage = require('../../models/TechPackage');
    const OrganicProduct = require('../../models/OrganicProduct');
    const Policy = require('../../models/Policy');
    const geoHelper = require('../../helpers/geoHelper');

    const [organic, seasonal, tech, policies] = await Promise.all([
      OrganicProduct.find(),
      SeasonalProduct.find(),
      TechPackage.find(),
      Policy.find()
    ]);

    let updatedCount = 0;

    for (const p of organic) {
      if (!p.geoSummary || !p.aiDescription || !p.aiKeywords || !p.aiCategoryDescription || !p.entityDescription) {
        geoHelper.autoFillGeoFields(p, 'organic');
        await p.save();
        updatedCount++;
      }
    }

    for (const p of seasonal) {
      if (!p.geoSummary || !p.aiDescription || !p.aiKeywords || !p.aiCategoryDescription || !p.entityDescription) {
        geoHelper.autoFillGeoFields(p, 'seasonal');
        await p.save();
        updatedCount++;
      }
    }

    for (const p of tech) {
      if (!p.geoSummary || !p.aiDescription || !p.aiKeywords || !p.aiCategoryDescription || !p.entityDescription) {
        geoHelper.autoFillGeoFields(p, 'tech');
        await p.save();
        updatedCount++;
      }
    }

    for (const p of policies) {
      if (!p.geoSummary || !p.aiDescription || !p.entityDescription || !p.aiSearchKeywords) {
        const cleanContent = (p.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const shortDesc = cleanContent.substring(0, 150) + (cleanContent.length > 150 ? '...' : '');
        
        if (!p.geoSummary) {
          p.geoSummary = `${p.title} guidelines and legal agreement for Swadesi Carts visitors, users, and customers.`;
        }
        if (!p.aiDescription) {
          p.aiDescription = `Swadesi Carts legal document outlining terms: ${shortDesc}`;
        }
        if (!p.entityDescription) {
          p.entityDescription = `Entity: ${p.title}\nType: Policy/Legal Document\nProvider: Swadesi Carts`;
        }
        if (!p.aiSearchKeywords) {
          p.aiSearchKeywords = `swadesi carts, ${p.slug}, policy, legal, agreement`;
        }
        await p.save();
        updatedCount++;
      }
    }

    req.flash('success', `Successfully auto-populated GEO fields for ${updatedCount} products/packages/policies!`);
    res.redirect('/admin/seo-geo');
  } catch (error) {
    console.error('Bulk generate GEO error:', error);
    req.flash('error', 'An error occurred during bulk generation.');
    res.redirect('/admin/seo-geo');
  }
};

// GET /admin/critical-alerts
exports.getCriticalAlerts = async (req, res) => {
  try {
    const CriticalAlert = require('../../models/CriticalAlert');
    const alerts = await CriticalAlert.find().sort({ createdAt: -1 });

    res.render('admin/critical-alerts/list', {
      title: 'Critical Security Alerts',
      alerts,
      adminName: req.session.adminName,
      currentPage: 'critical-alerts',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Critical Alerts list error:', error);
    res.status(500).send('Server Error');
  }
};

// POST /admin/critical-alerts/resolve/:id
exports.resolveCriticalAlert = async (req, res) => {
  try {
    const CriticalAlert = require('../../models/CriticalAlert');
    const User = require('../../models/User');

    const alert = await CriticalAlert.findById(req.params.id);
    if (!alert) {
      req.flash('error', 'Alert not found');
      return res.redirect('/admin/critical-alerts');
    }

    // Mark alert as resolved
    alert.isResolved = true;
    alert.blockedUntil = new Date(0); // set to past date immediately
    await alert.save();

    // Find user by email or phone and clear their OTP blocks
    const matchConditions = [];
    if (alert.userEmail) matchConditions.push({ email: alert.userEmail });
    if (alert.userPhone) matchConditions.push({ phone: alert.userPhone });

    if (matchConditions.length > 0) {
      const user = await User.findOne({ $or: matchConditions });
      if (user) {
        user.otpAttempts = 0;
        user.otpBlockedUntil = null;
        await user.save();
      }
    }

    // Clear in-memory IP attempts cache
    const userAuthController = require('../userAuthController');
    userAuthController.clearIpAttempts(alert.ipAddress);

    // Clear express-rate-limit cache for this IP
    try {
      const rateLimiters = require('../../middleware/rateLimiters');
      if (rateLimiters.authLimiter && typeof rateLimiters.authLimiter.resetKey === 'function') {
        rateLimiters.authLimiter.resetKey(alert.ipAddress);
      }
      if (rateLimiters.loginLimiter && typeof rateLimiters.loginLimiter.resetKey === 'function') {
        rateLimiters.loginLimiter.resetKey(alert.ipAddress);
      }
      if (rateLimiters.globalLimiter && typeof rateLimiters.globalLimiter.resetKey === 'function') {
        rateLimiters.globalLimiter.resetKey(alert.ipAddress);
      }
      if (rateLimiters.spamLimiter && typeof rateLimiters.spamLimiter.resetKey === 'function') {
        rateLimiters.spamLimiter.resetKey(alert.ipAddress);
      }
    } catch (limiterError) {
      console.error('Error clearing express rate limiters:', limiterError);
    }

    req.flash('success', 'Critical Alert resolved and user/IP time limits removed successfully.');
    res.redirect('/admin/critical-alerts');
  } catch (error) {
    console.error('Resolve critical alert error:', error);
    req.flash('error', 'An error occurred while resolving the alert.');
    res.redirect('/admin/critical-alerts');
  }
};

const runAuditAndGenerateReport = async () => {
  const fs = require('fs');
  const path = require('path');
  const OrganicProduct = require('../../models/OrganicProduct');
  const SeasonalProduct = require('../../models/SeasonalProduct');
  const TechPackage = require('../../models/TechPackage');
  const Policy = require('../../models/Policy');
  const WebsiteSetting = require('../../models/WebsiteSetting');

  // Fetch site settings
  const settings = await WebsiteSetting.findOne().lean() || {};

  const [organic, seasonal, tech, policies] = await Promise.all([
    OrganicProduct.find().lean(),
    SeasonalProduct.find().lean(),
    TechPackage.find().lean(),
    Policy.find().lean()
  ]);

  // 1. Audit Files
  const filesToAudit = [
    { filename: 'robots.txt', path: 'public/robots.txt' },
    { filename: 'sitemap.xml', path: 'public/sitemap.xml' },
    { filename: 'geositemap.xml', path: 'public/geositemap.xml' },
    { filename: 'llms.txt', path: 'public/llms.txt' },
    { filename: 'llms-full.txt', path: 'public/llms-full.txt' },
    { filename: 'ai-manifest.json', path: 'public/ai-manifest.json' },
    { filename: 'knowledge-base.json', path: 'public/knowledge-base.json' },
    { filename: 'entities.json', path: 'public/entities.json' }
  ];

  const auditedFiles = [];
  let fileCompleteCount = 0;
  for (const f of filesToAudit) {
    const fullPath = path.join(__dirname, '../../', f.path);
    const exists = fs.existsSync(fullPath);
    let size = 0;
    let status = 'Missing';
    if (exists) {
      size = fs.statSync(fullPath).size;
      status = size > 0 ? 'Optimal' : 'Empty';
      if (size > 0) fileCompleteCount++;
    }
    auditedFiles.push({
      filename: f.filename,
      path: '/' + f.filename,
      exists,
      size,
      status
    });
  }

  // Sitemap discrepancy check
  let sitemapSlugs = [];
  const sitemapPath = path.join(__dirname, '../../public/sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const matches = sitemapContent.match(/<loc>[^<]+<\/loc>/g) || [];
    sitemapSlugs = matches.map(loc => {
      const url = loc.replace('<loc>', '').replace('</loc>', '').trim();
      const parts = url.split('/').filter(Boolean);
      return parts[parts.length - 1] || '';
    }).filter(Boolean);
  }

  // 2. Metrics & Diagnostics
  let totalItems = 0;
  let missingSeoCount = 0;
  let missingGeoCount = 0;
  let missingAltCount = 0;
  let missingCanonicalCount = 0;
  let sitemapDiscrepancyCount = 0;

  const itemsAudit = [];

  const processItem = (item, type) => {
    totalItems++;
    const id = item._id;
    const title = item.title;
    const slug = item.slug;
    
    const hasSeoTitle = !!(item.seoTitle || '').trim();
    const hasSeoDesc = !!(type === 'policy' ? (item.seoDescription || '') : (item.seoMetaDescription || '')).trim();
    const hasSeoKeywords = !!(item.seoKeywords || '').trim();
    const hasGeoSummary = !!(item.geoSummary || '').trim();
    const hasAiDesc = !!(item.aiDescription || '').trim();
    const hasAiKeywords = !!(item.aiKeywords || item.geoKeywords || item.aiSearchKeywords || '').trim();
    const hasEntityDesc = !!(item.entityDescription || '').trim();

    const isMissingSeo = !hasSeoTitle || !hasSeoDesc || !hasSeoKeywords;
    const isMissingGeo = !hasGeoSummary || !hasAiDesc || !hasAiKeywords || !hasEntityDesc;
    
    if (isMissingSeo) missingSeoCount++;
    if (isMissingGeo) missingGeoCount++;

    let hasImage = false;
    let imageAltOk = true;
    if (item.featuredImage && item.featuredImage.url) {
      hasImage = true;
      imageAltOk = hasSeoTitle;
    }
    if (hasImage && !imageAltOk) {
      missingAltCount++;
    }

    const inSitemap = sitemapSlugs.includes(slug);
    if (!inSitemap) {
      sitemapDiscrepancyCount++;
    }

    itemsAudit.push({
      id,
      title,
      type,
      slug,
      isMissingSeo,
      isMissingGeo,
      inSitemap
    });
  };

  organic.forEach(p => processItem(p, 'organic'));
  seasonal.forEach(p => processItem(p, 'seasonal'));
  tech.forEach(p => processItem(p, 'tech'));
  policies.forEach(p => processItem(p, 'policy'));

  // Compute Health Scores
  const seoHealth = totalItems > 0 ? Math.round(((totalItems - missingSeoCount) / totalItems) * 100) : 100;
  const fileScore = filesToAudit.length > 0 ? Math.round((fileCompleteCount / filesToAudit.length) * 100) : 100;
  const geoHealth = totalItems > 0 ? Math.round(((totalItems - missingGeoCount) / totalItems) * 100) : 100;

  // Diagnostics Flags
  const diagnostics = [];
  if (missingSeoCount > 0) {
    diagnostics.push({
      type: 'WARNING',
      message: `${missingSeoCount} items are missing core SEO metadata (Title, Keywords, or Meta Description).`,
      impact: 'Search engines might display generic snippet or fail to rank page for primary keywords.'
    });
  }
  if (missingGeoCount > 0) {
    diagnostics.push({
      type: 'WARNING',
      message: `${missingGeoCount} items are missing GEO fields (geoSummary, aiDescription, or entityDescription).`,
      impact: 'AI engines (ChatGPT, Claude, Perplexity) may fail to accurately extract company context or structure responses.'
    });
  }
  if (missingAltCount > 0) {
    diagnostics.push({
      type: 'INFO',
      message: `${missingAltCount} pages with images are missing optimized image descriptive tags.`,
      impact: 'Sub-optimal image search visibility.'
    });
  }
  if (sitemapDiscrepancyCount > 0) {
    diagnostics.push({
      type: 'CRITICAL',
      message: `${sitemapDiscrepancyCount} items are missing from public/sitemap.xml.`,
      impact: 'Search crawlers might not discover these pages during structural audits.'
    });
  }

  auditedFiles.forEach(f => {
    if (!f.exists) {
      diagnostics.push({
        type: 'CRITICAL',
        message: `Physical file is missing: ${f.filename}`,
        impact: `Severely damages ${f.filename.includes('sitemap') ? 'Search Crawling' : 'AI Agent Indexing'} (Status 404).`
      });
    }
  });

  // Keywords
  const seoKeywords = {
    semantic: [
      'authentic swadesi carts organic foods',
      'reliable seasonal festival harvest booking',
      'gujarat hyperlocal organic supply chain',
      'professional website developer ahmedabad',
      'business software packages gujarat'
    ],
    voice: [
      'where to buy fresh mangoes in ahmedabad',
      'best company for IT consulting in gujarat',
      'how to order chemical free rice online',
      'swadesi carts contact number gujarat'
    ],
    trending: [
      'zero pesticide grains india 2026',
      'eco friendly startup tech templates',
      'micro irrigation organic farm fresh produce'
    ]
  };

  const geoKeywords = {
    local: [
      'organic farms near SG Highway Ahmedabad',
      'fresh farm vegetables delivery Satellite Ahmedabad',
      'best IT agency Prahladnagar Ahmedabad'
    ],
    queries: [
      'swadesi carts ahmedabad gujarat',
      'organic food suppliers gujarat india',
      'tech development company ahmedabad'
    ],
    locationIntent: {
      center: 'Ahmedabad, Gujarat, India',
      coordinates: 'Latitude: 23.0225, Longitude: 72.5714',
      serviceAreas: [
        'Ahmedabad Municipal Corporation',
        'Gandhinagar',
        'Rajkot',
        'Surat',
        'Vadodara'
      ]
    }
  };

  // Simulated AI responses
  const aiSearchIntelligence = {
    chatgpt: {
      summary: 'ChatGPT Simulator',
      query: 'What is Swadesi Carts?',
      simulatedResponse: 'Swadesi Carts is a premium Indian marketplace and enterprise provider located in Ahmedabad, Gujarat. They bridge the gap between rural producers and urban consumers by supplying direct-from-farm organic goods and seasonal harvests. Additionally, they offer comprehensive, modular technology development packages for businesses seeking web development, customization, and deployment services.'
    },
    gemini: {
      summary: 'Gemini Simulator',
      query: 'Best organic product supplier in Gujarat',
      simulatedResponse: 'Swadesi Carts is highly visible for certified organic, zero-chemical grains, spices, and fresh seasonal harvests in Gujarat. Sourcing directly from verified local farms, they serve Ahmedabad and major Indian metropolitan cities with secure B2B and B2C supply chains.'
    },
    perplexity: {
      summary: 'Perplexity Simulator',
      query: 'Who provides tech packages in Ahmedabad?',
      simulatedResponse: 'Swadesi Carts offers structured, production-ready tech packages alongside their agriculture divisions. These packages include full-stack customization (Node.js, Express, MongoDB), professional deployment support, and dynamic SEO/GEO optimization blueprints, making them a local option for Ahmedabad SMBs.'
    },
    claude: {
      summary: 'Claude Simulator',
      query: 'Swadesi Carts policies and security review',
      simulatedResponse: 'Swadesi Carts maintains a transparent privacy policy, refund guidelines, and Terms of Service. They utilize standard modern security layers, CSRF protection, request rate limiters, and clean session-based admin controls, making their website and services secure and reliable.'
    },
    copilot: {
      summary: 'Copilot Simulator',
      query: 'Swadesi Carts location & business contact details',
      simulatedResponse: `Based in Ahmedabad, Gujarat, India, Swadesi Carts operates under coordinates 23.0225° N, 72.5714° E. Their primary contact info is listed as phone: ${settings.footer?.phone || '+91-000-0000000'} and email: ${settings.footer?.email || 'info@swadesicarts.com'}, with operational support during standard business hours.`
    }
  };

  const report = {
    lastUpdated: new Date().toISOString(),
    seoHealth,
    geoHealth,
    fileScore,
    totalItems,
    missingSeoCount,
    missingGeoCount,
    missingAltCount,
    sitemapDiscrepancyCount,
    auditedFiles,
    diagnostics,
    keywords: {
      seo: seoKeywords,
      geo: geoKeywords
    },
    aiSearchIntelligence,
    items: itemsAudit
  };

  const reportPath = path.join(__dirname, '../../public/seo-geo-intelligence-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  return report;
};

exports.postAnalyzeWebsite = async (req, res) => {
  try {
    const report = await runAuditAndGenerateReport();
    res.json({
      success: true,
      message: 'Website analysis completed successfully! SEO & GEO Intelligence Report generated.',
      report
    });
  } catch (error) {
    console.error('Analyze website error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while analyzing the website.' });
  }
};

exports.postApplyIntelligence = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const OrganicProduct = require('../../models/OrganicProduct');
    const SeasonalProduct = require('../../models/SeasonalProduct');
    const TechPackage = require('../../models/TechPackage');
    const Policy = require('../../models/Policy');
    const geoHelper = require('../../helpers/geoHelper');

    const { mode } = req.body;
    if (!mode || (mode !== 'seo' && mode !== 'geo')) {
      return res.status(400).json({ success: false, message: 'Invalid apply mode. Must be "seo" or "geo".' });
    }

    const [organic, seasonal, tech, policies] = await Promise.all([
      OrganicProduct.find(),
      SeasonalProduct.find(),
      TechPackage.find(),
      Policy.find()
    ]);

    let updatedCount = 0;

    // Apply to Organic Products
    for (const p of organic) {
      let modified = false;
      if (mode === 'seo') {
        if (!p.seoTitle || !p.seoTitle.trim()) {
          p.seoTitle = `${p.title} | Buy ${p.category} online - Swadesi Carts`;
          modified = true;
        }
        if (!p.seoMetaDescription || !p.seoMetaDescription.trim()) {
          p.seoMetaDescription = `Buy premium ${p.title} (${p.category}) from Swadesi Carts. Sourced sustainably from local growers in India. ${p.shortDescription || ''}`;
          modified = true;
        }
        if (!p.seoKeywords || !p.seoKeywords.trim()) {
          p.seoKeywords = `swadesi carts, ${p.title.toLowerCase()}, ${p.category.toLowerCase()}, buy ${p.title.toLowerCase()} online`;
          modified = true;
        }
      } else if (mode === 'geo') {
        if (!p.geoSummary || !p.geoSummary.trim()) {
          p.geoSummary = geoHelper.generateProductGeoSummary(p, 'organic');
          modified = true;
        }
        if (!p.aiDescription || !p.aiDescription.trim()) {
          p.aiDescription = geoHelper.generateAiDescription(p, 'organic');
          modified = true;
        }
        if (!p.aiKeywords || !p.aiKeywords.trim()) {
          p.aiKeywords = geoHelper.generateAiKeywords(p, 'organic');
          modified = true;
        }
        if (!p.entityDescription || !p.entityDescription.trim()) {
          p.entityDescription = geoHelper.generateEntityDescription(p, 'organic');
          modified = true;
        }
        if (!p.aiCategoryDescription || !p.aiCategoryDescription.trim()) {
          p.aiCategoryDescription = geoHelper.generateAiCategoryDescription(p.category);
          modified = true;
        }
      }
      if (modified) {
        await p.save();
        updatedCount++;
      }
    }

    // Apply to Seasonal Products
    for (const p of seasonal) {
      let modified = false;
      if (mode === 'seo') {
        if (!p.seoTitle || !p.seoTitle.trim()) {
          p.seoTitle = `${p.title} | Seasonal Harvest - Swadesi Carts`;
          modified = true;
        }
        if (!p.seoMetaDescription || !p.seoMetaDescription.trim()) {
          p.seoMetaDescription = `Book authentic seasonal harvest of ${p.title} (${p.category}) direct from farmers. ${p.shortDescription || ''}`;
          modified = true;
        }
        if (!p.seoKeywords || !p.seoKeywords.trim()) {
          p.seoKeywords = `swadesi carts, seasonal ${p.title.toLowerCase()}, ${p.category.toLowerCase()}, booking ${p.title.toLowerCase()}`;
          modified = true;
        }
      } else if (mode === 'geo') {
        if (!p.geoSummary || !p.geoSummary.trim()) {
          p.geoSummary = geoHelper.generateProductGeoSummary(p, 'seasonal');
          modified = true;
        }
        if (!p.aiDescription || !p.aiDescription.trim()) {
          p.aiDescription = geoHelper.generateAiDescription(p, 'seasonal');
          modified = true;
        }
        if (!p.aiKeywords || !p.aiKeywords.trim()) {
          p.aiKeywords = geoHelper.generateAiKeywords(p, 'seasonal');
          modified = true;
        }
        if (!p.entityDescription || !p.entityDescription.trim()) {
          p.entityDescription = geoHelper.generateEntityDescription(p, 'seasonal');
          modified = true;
        }
        if (!p.aiCategoryDescription || !p.aiCategoryDescription.trim()) {
          p.aiCategoryDescription = geoHelper.generateAiCategoryDescription(p.category);
          modified = true;
        }
      }
      if (modified) {
        await p.save();
        updatedCount++;
      }
    }

    // Apply to Tech Packages
    for (const p of tech) {
      let modified = false;
      if (mode === 'seo') {
        if (!p.seoTitle || !p.seoTitle.trim()) {
          p.seoTitle = `${p.title} | Business Tech Package - Swadesi Carts`;
          modified = true;
        }
        if (!p.seoMetaDescription || !p.seoMetaDescription.trim()) {
          p.seoMetaDescription = `Scale your business with Swadesi Carts ${p.title} package. Includes customization, hosting, and professional setup. ${p.shortDescription || ''}`;
          modified = true;
        }
        if (!p.seoKeywords || !p.seoKeywords.trim()) {
          p.seoKeywords = `swadesi carts, ${p.title.toLowerCase()}, tech package, web development, custom software`;
          modified = true;
        }
      } else if (mode === 'geo') {
        if (!p.geoSummary || !p.geoSummary.trim()) {
          p.geoSummary = geoHelper.generateProductGeoSummary(p, 'tech');
          modified = true;
        }
        if (!p.aiDescription || !p.aiDescription.trim()) {
          p.aiDescription = geoHelper.generateAiDescription(p, 'tech');
          modified = true;
        }
        if (!p.aiKeywords || !p.aiKeywords.trim()) {
          p.aiKeywords = geoHelper.generateAiKeywords(p, 'tech');
          modified = true;
        }
        if (!p.entityDescription || !p.entityDescription.trim()) {
          p.entityDescription = geoHelper.generateEntityDescription(p, 'tech');
          modified = true;
        }
        if (!p.aiCategoryDescription || !p.aiCategoryDescription.trim()) {
          p.aiCategoryDescription = geoHelper.generateAiCategoryDescription(p.category);
          modified = true;
        }
      }
      if (modified) {
        await p.save();
        updatedCount++;
      }
    }

    // Apply to Policies
    for (const p of policies) {
      let modified = false;
      const cleanContent = (p.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const shortDesc = cleanContent.substring(0, 150) + (cleanContent.length > 150 ? '...' : '');

      if (mode === 'seo') {
        if (!p.seoTitle || !p.seoTitle.trim()) {
          p.seoTitle = `${p.title} - Legal Policy - Swadesi Carts`;
          modified = true;
        }
        if (!p.seoDescription || !p.seoDescription.trim()) {
          p.seoDescription = `Read the official ${p.title} of Swadesi Carts. Outlining guidelines, compliance, and user terms.`;
          modified = true;
        }
        if (!p.seoKeywords || !p.seoKeywords.trim()) {
          p.seoKeywords = `swadesi carts, policy, legal, agreement, ${p.slug}`;
          modified = true;
        }
      } else if (mode === 'geo') {
        if (!p.geoSummary || !p.geoSummary.trim()) {
          p.geoSummary = `${p.title} guidelines and legal agreement for Swadesi Carts visitors, users, and customers in Ahmedabad, Gujarat, India.`;
          modified = true;
        }
        if (!p.aiDescription || !p.aiDescription.trim()) {
          p.aiDescription = `Swadesi Carts legal policy outlining: ${shortDesc}`;
          modified = true;
        }
        if (!p.entityDescription || !p.entityDescription.trim()) {
          p.entityDescription = `Entity: ${p.title}\nType: Policy/Legal Document\nProvider: Swadesi Carts`;
          modified = true;
        }
        if (!p.aiSearchKeywords || !p.aiSearchKeywords.trim()) {
          p.aiSearchKeywords = `swadesi carts, ${p.slug}, policy, legal, agreement`;
          modified = true;
        }
      }
      if (modified) {
        await p.save();
        updatedCount++;
      }
    }

    const report = await runAuditAndGenerateReport();

    res.json({
      success: true,
      message: `Successfully applied ${mode.toUpperCase()} intelligence to ${updatedCount} blank fields!`,
      report
    });
  } catch (error) {
    console.error('Apply intelligence error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while applying intelligence.' });
  }
};

// Reviews Management Section
const Review = require('../../models/Review');

exports.listReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    
    res.render('admin/reviews/list', {
      title: 'Customer Reviews Management',
      reviews,
      adminName: req.session.adminName,
      currentPage: 'reviews',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('List reviews error:', error);
    res.status(500).send('Server Error');
  }
};

exports.toggleHideReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      req.flash('error', 'Review not found');
      return res.redirect('/admin/reviews');
    }

    review.isHidden = !review.isHidden;
    await review.save();

    req.flash('success', `Review successfully ${review.isHidden ? 'hidden' : 'shown'}.`);
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Toggle hide review error:', error);
    req.flash('error', 'Server error');
    res.redirect('/admin/reviews');
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      req.flash('error', 'Review not found');
      return res.redirect('/admin/reviews');
    }

    req.flash('success', 'Review deleted successfully.');
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Delete review error:', error);
    req.flash('error', 'Server error');
    res.redirect('/admin/reviews');
  }
};

exports.bulkActionReviews = async (req, res) => {
  try {
    const { action } = req.body;
    let reviewIds = req.body.reviewIds || req.body['reviewIds[]'];
    
    if (!reviewIds) {
      req.flash('error', 'No reviews selected.');
      return res.redirect('/admin/reviews');
    }

    if (!Array.isArray(reviewIds)) {
      reviewIds = [reviewIds];
    }

    if (reviewIds.length === 0) {
      req.flash('error', 'No reviews selected.');
      return res.redirect('/admin/reviews');
    }

    if (action === 'delete') {
      await Review.deleteMany({ _id: { $in: reviewIds } });
      req.flash('success', `Successfully deleted ${reviewIds.length} reviews.`);
    } else if (action === 'hide') {
      await Review.updateMany({ _id: { $in: reviewIds } }, { isHidden: true });
      req.flash('success', `Successfully hid ${reviewIds.length} reviews.`);
    } else if (action === 'show') {
      await Review.updateMany({ _id: { $in: reviewIds } }, { isHidden: false });
      req.flash('success', `Successfully showed ${reviewIds.length} reviews.`);
    } else {
      req.flash('error', 'Invalid action selected.');
    }

    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Bulk action reviews error:', error);
    req.flash('error', 'Server error performing bulk action.');
    res.redirect('/admin/reviews');
  }
};

