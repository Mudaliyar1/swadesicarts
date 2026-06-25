const TechPackage = require('../models/TechPackage');
const Ticket = require('../models/Ticket');
const sendEmail = require('../helpers/email');
const Story = require('../models/Story');
const { productSchema, faqSchema, breadcrumbSchema, toJsonLd } = require('../helpers/schemaHelper');
const { getSiteUrl } = require('../helpers/siteUrl');

// Helper function to get active stories
async function getActiveStories() {
  try {
    return await Story.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

// Get all tech packages
exports.getAllPackages = async (req, res) => {
  try {
    const selectedCategory = req.query.category || '';
    
    // Get all unique categories
    const categories = await TechPackage.distinct('category');
    
    // Build query - show all packages or filter by category
    const query = {};
    if (selectedCategory) {
      query.category = selectedCategory;
    }
    
    const packages = await TechPackage.find(query)
      .sort({ order: 1, createdAt: -1 });

    const stories = await getActiveStories();

    res.render('public/tech-packages-new', {
      title: 'Tech Services & Packages - Swadesi Carts',
      packages,
      categories: categories.sort(),
      selectedCategory,
      stories,
      currentPage: 'tech'
    });
  } catch (error) {
    console.error('Tech packages error:', error);
    res.status(500).send('Server Error');
  }
};

// Get single package detail
exports.getPackageDetail = async (req, res) => {
  try {
    console.log('Looking for tech package with slug:', req.params.slug);
    const package = await TechPackage.findOne({ 
      slug: req.params.slug
    });

    console.log('Found package:', package ? package.title : 'Not found');

    if (!package) {
      return res.status(404).render('public/404', {
        title: 'Package Not Found'
      });
    }

    const stories = await getActiveStories();
    const baseUrl = getSiteUrl(res.locals.siteSettings);
    const pageUrl = `${baseUrl}/tech-packages/${package.slug}`;
    const productDescription = package.shortDescription || package.fullDescription || package.title;
    const faqQuestions = [
      {
        question: `What is ${package.title}?`,
        answer: productDescription
      },
      {
        question: `Who should choose ${package.title}?`,
        answer: `Businesses and individuals looking for ${package.title.toLowerCase()} services.`
      },
      {
        question: 'How do I get a quote?',
        answer: 'Use the inquiry form or WhatsApp button to request pricing, delivery, and scope details.'
      }
    ];

    res.render('public/product-detail-template', {
      title: `${package.title} - Swadesi Carts`,
      product: package,
      type: 'tech',
      stories,
      currentPage: 'tech',
      seo: {
        title: package.seoTitle || `${package.title} - Swadesi Carts`,
        description: package.seoMetaDescription || package.shortDescription || package.fullDescription || package.title,
        keywords: [package.seoKeywords, package.geoKeywords, package.longTailKeywords].filter(Boolean).join(', '),
        canonical: pageUrl,
        ogType: 'product',
        ogImage: package.featuredImage && package.featuredImage.url ? package.featuredImage.url : '',
        geoKeywords: package.geoKeywords || '',
        aiSearchPhrases: package.aiSearchPhrases || ''
      },
      schemaJsonLd: [
        toJsonLd(productSchema({
          name: package.title,
          description: productDescription,
          url: pageUrl,
          image: package.featuredImage && package.featuredImage.url ? package.featuredImage.url : '',
          category: package.category,
          sku: package.slug,
          offers: package.price && package.price.amount ? {
            '@type': 'Offer',
            priceCurrency: package.price.currency || 'INR',
            price: package.price.amount
          } : undefined
        })),
        toJsonLd(breadcrumbSchema([
          { name: 'Home', url: baseUrl + '/' },
          { name: 'Tech Packages', url: baseUrl + '/tech-packages' },
          { name: package.title, url: pageUrl }
        ])),
        toJsonLd(faqSchema(faqQuestions))
      ],
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Package detail error:', error);
    res.status(500).send('Server Error');
  }
};

// Submit inquiry
// Submit inquiry from inquiry page
exports.submitInquiry = async (req, res) => {
  try {
    const { name, mobile, email, requirement, productId } = req.body;
    
    const package = await TechPackage.findById(productId);
    
    if (!package) {
      req.flash('error', 'Package not found');
      return res.redirect('/tech-packages/inquiry');
    }

    const ticket = await Ticket.create({
      name,
      mobile,
      email,
      user: req.session.userId || null,
      subject: `Inquiry for ${package.title}`,
      productType: 'tech',
      productId: package._id,
      productModel: 'TechPackage',
      productTitle: package.title,
      messages: [{
        sender: 'user',
        senderName: name,
        message: requirement
      }]
    });

    // Send confirmation email
    const subject = `[${ticket.ticketNumber}] We received your inquiry`;
    const html = `<p>Hello ${name},</p>
                  <p>Thank you for inquiring about <strong>${package.title}</strong>.</p>
                  <p>A support ticket has been opened for you: <strong>${ticket.ticketNumber}</strong>.</p>
                  <p>Our team will review your requirement and get back to you shortly.</p>
                  <hr>
                  <p><em>You can reply directly to this email to add more information to your ticket.</em></p>`;
    await sendEmail(email, subject, html).catch(err => console.error('Failed to send ticket email:', err));

    req.flash('success', `Inquiry submitted successfully! Your ticket number is ${ticket.ticketNumber}. Check your email.`);
    res.redirect('/tech-packages/' + package.slug);
  } catch (error) {
    console.error('Inquiry submission error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('back');
  }
};

// Get inquiry page
exports.getInquiryPage = async (req, res) => {
  try {
    const packages = await TechPackage.find()
      .select('_id title price shortDescription category slug featuredImage')
      .sort({ title: 1 });

    const selectedProductId = req.query.productId || '';
    const selectedProduct = selectedProductId
      ? packages.find(product => product._id.toString() === selectedProductId.toString()) || null
      : null;
    const baseUrl = getSiteUrl(res.locals.siteSettings);

    res.render('public/tech-inquiry', {
      title: 'Tech Package Inquiry - Swadesi Carts',
      products: packages,
      selectedProductId,
      selectedProduct,
      seo: {
        title: 'Tech Package Inquiry - Swadesi Carts',
        description: selectedProduct ? `Inquiry form for ${selectedProduct.title} on Swadesi Carts.` : 'Send an inquiry for tech packages on Swadesi Carts.',
        canonical: `${baseUrl}/tech-packages/inquiry`,
        keywords: 'tech inquiry, tech packages, Swadesi Carts',
        ogType: 'article'
      },
      inquiryPrefill: selectedProduct ? {
        productId: selectedProduct._id.toString(),
        productTitle: selectedProduct.title,
        productCategory: selectedProduct.category,
        productPrice: selectedProduct.price && selectedProduct.price.displayText ? selectedProduct.price.displayText : '',
        productDescription: selectedProduct.shortDescription || '',
        productType: 'tech',
        packageName: selectedProduct.title,
        autoRequirement: true
      } : {},
      currentPage: 'tech'
    });
  } catch (error) {
    console.error('Inquiry page error:', error);
    res.status(500).send('Server Error');
  }
};
