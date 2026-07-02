const Policy = require('../models/Policy');

// ==========================================
// ADMIN ACTIONS
// ==========================================

// Get all policies (Admin Panel list)
exports.getAdminPolicies = async (req, res) => {
  try {
    const policies = await Policy.find().sort({ title: 1 });
    res.render('admin/policies/index', {
      title: 'Legal & Policies - Admin Panel',
      policies,
      currentPage: 'policies'
    });
  } catch (error) {
    console.error('Error fetching admin policies:', error);
    req.flash('error', 'Could not load policy list.');
    res.redirect('/admin/dashboard');
  }
};

// Render create page
exports.getCreatePolicy = async (req, res) => {
  res.render('admin/policies/create', {
    title: 'Create Legal Policy - Admin Panel',
    currentPage: 'policies'
  });
};

// Handle create policy submission
exports.postCreatePolicy = async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      geoSummary,
      aiDescription,
      entityDescription,
      aiSearchKeywords,
      structuredAiMetadata
    } = req.body;

    if (!title || !slug || !content) {
      req.flash('error', 'Title, Slug, and Content are required fields.');
      return res.redirect('/admin/policies/create');
    }

    const formattedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    const existing = await Policy.findOne({ slug: formattedSlug });
    if (existing) {
      req.flash('error', 'A policy with this slug already exists.');
      return res.redirect('/admin/policies/create');
    }

    await Policy.create({
      title: title.trim(),
      slug: formattedSlug,
      content,
      status: status || 'draft',
      seoTitle: seoTitle ? seoTitle.trim() : '',
      seoDescription: seoDescription ? seoDescription.trim() : '',
      seoKeywords: seoKeywords ? seoKeywords.trim() : '',
      geoSummary: geoSummary ? geoSummary.trim() : '',
      aiDescription: aiDescription ? aiDescription.trim() : '',
      entityDescription: entityDescription ? entityDescription.trim() : '',
      aiSearchKeywords: aiSearchKeywords ? aiSearchKeywords.trim() : '',
      structuredAiMetadata: structuredAiMetadata ? structuredAiMetadata.trim() : '{}'
    });

    req.flash('success', 'Policy created successfully!');
    res.redirect('/admin/policies');
  } catch (error) {
    console.error('Error creating policy:', error);
    req.flash('error', 'Error creating policy: ' + error.message);
    res.redirect('/admin/policies/create');
  }
};

// Render edit page
exports.getEditPolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      req.flash('error', 'Policy not found.');
      return res.redirect('/admin/policies');
    }
    res.render('admin/policies/edit', {
      title: `Edit ${policy.title} - Admin Panel`,
      policy,
      currentPage: 'policies'
    });
  } catch (error) {
    console.error('Error fetching policy for edit:', error);
    req.flash('error', 'Could not open policy for editing.');
    res.redirect('/admin/policies');
  }
};

// Render edit page by slug
exports.getEditPolicyBySlug = async (req, res) => {
  try {
    const policy = await Policy.findOne({ slug: req.params.slug });
    if (!policy) {
      req.flash('error', `Policy with slug "${req.params.slug}" not found.`);
      return res.redirect('/admin/policies');
    }
    res.render('admin/policies/edit', {
      title: `Edit ${policy.title} - Admin Panel`,
      policy,
      currentPage: 'policies'
    });
  } catch (error) {
    console.error('Error fetching policy by slug for edit:', error);
    req.flash('error', 'Could not open policy for editing.');
    res.redirect('/admin/policies');
  }
};

// Handle edit submission
exports.postEditPolicy = async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      geoSummary,
      aiDescription,
      entityDescription,
      aiSearchKeywords,
      structuredAiMetadata
    } = req.body;

    if (!title || !slug || !content) {
      req.flash('error', 'Title, Slug, and Content are required fields.');
      return res.redirect(`/admin/policies/edit/${req.params.id}`);
    }

    const formattedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    const existing = await Policy.findOne({ slug: formattedSlug, _id: { $ne: req.params.id } });
    if (existing) {
      req.flash('error', 'Another policy with this slug already exists.');
      return res.redirect(`/admin/policies/edit/${req.params.id}`);
    }

    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      req.flash('error', 'Policy not found.');
      return res.redirect('/admin/policies');
    }

    policy.title = title.trim();
    policy.slug = formattedSlug;
    policy.content = content;
    policy.status = status || 'draft';
    policy.seoTitle = seoTitle ? seoTitle.trim() : '';
    policy.seoDescription = seoDescription ? seoDescription.trim() : '';
    policy.seoKeywords = seoKeywords ? seoKeywords.trim() : '';
    policy.geoSummary = geoSummary ? geoSummary.trim() : '';
    policy.aiDescription = aiDescription ? aiDescription.trim() : '';
    policy.entityDescription = entityDescription ? entityDescription.trim() : '';
    policy.aiSearchKeywords = aiSearchKeywords ? aiSearchKeywords.trim() : '';
    policy.structuredAiMetadata = structuredAiMetadata ? structuredAiMetadata.trim() : '{}';

    await policy.save();
    req.flash('success', 'Policy updated successfully!');
    res.redirect('/admin/policies');
  } catch (error) {
    console.error('Error editing policy:', error);
    req.flash('error', 'Error updating policy: ' + error.message);
    res.redirect(`/admin/policies/edit/${req.params.id}`);
  }
};

// Toggle policy status between published & draft
exports.postToggleStatus = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found.' });
    }
    policy.status = policy.status === 'published' ? 'draft' : 'published';
    await policy.save();
    res.json({ success: true, newStatus: policy.status });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete policy
exports.postDeletePolicy = async (req, res) => {
  try {
    const result = await Policy.findByIdAndDelete(req.params.id);
    if (!result) {
      req.flash('error', 'Policy not found.');
    } else {
      req.flash('success', 'Policy deleted successfully!');
    }
    res.redirect('/admin/policies');
  } catch (error) {
    console.error('Error deleting policy:', error);
    req.flash('error', 'Could not delete policy.');
    res.redirect('/admin/policies');
  }
};

// ==========================================
// PUBLIC ACTIONS
// ==========================================

// Get a policy by slug for public view
exports.getPolicyBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug || req.path.replace('/', '');
    const policy = await Policy.findOne({ slug, status: 'published' });
    
    if (!policy) {
      return next();
    }

    // Load other published policies for the sidebar list
    const otherPolicies = await Policy.find({ status: 'published' }).select('title slug');

    res.render('policies/detail', {
      title: policy.seoTitle || `${policy.title} - Swadesi Carts`,
      policy,
      otherPolicies,
      currentPage: slug,
      seo: {
        title: policy.seoTitle || `${policy.title} - Swadesi Carts`,
        description: policy.seoDescription,
        keywords: policy.seoKeywords,
        canonical: `${req.protocol}://${req.get('host')}/${policy.slug}`,
        geoKeywords: policy.aiSearchKeywords,
        aiSearchPhrases: policy.aiSearchKeywords
      },
      schemaJsonLd: [
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": policy.title,
          "description": policy.seoDescription,
          "url": `${req.protocol}://${req.get('host')}/${policy.slug}`,
          "datePublished": policy.createdAt,
          "dateModified": policy.updatedAt
        }),
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": `${req.protocol}://${req.get('host')}/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": policy.title,
              "item": `${req.protocol}://${req.get('host')}/${policy.slug}`
            }
          ]
        }),
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Swadesi Carts",
          "url": `${req.protocol}://${req.get('host')}/`,
          "logo": `${req.protocol}://${req.get('host')}/images/logo.png`
        })
      ]
    });
  } catch (error) {
    console.error('Error loading policy:', error);
    res.status(500).render('public/500', {
      title: 'Server Error - Swadesi Carts',
      currentPage: ''
    });
  }
};
