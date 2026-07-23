const OrganicProduct = require('../models/OrganicProduct');
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

// Get all organic products
exports.getAllProducts = async (req, res) => {
  try {
    const selectedCategory = req.query.category || '';
    
    // Get all unique categories
    const categories = await OrganicProduct.distinct('category', { isVisible: true });
    
    // Build query
    const query = { isVisible: true };
    if (selectedCategory) {
      query.category = selectedCategory;
    }
    
    const products = await OrganicProduct.find(query)
      .sort({ order: 1, createdAt: -1 });

    const stories = await getActiveStories();

    res.render('public/organic-products-new', {
      title: 'Organic Products - Swadesi Carts',
      products,
      categories: categories.sort(),
      selectedCategory,
      stories,
      currentPage: 'organic'
    });
  } catch (error) {
    console.error('Organic products error:', error);
    res.status(500).send('Server Error');
  }
};

// Get single product detail
exports.getProductDetail = async (req, res) => {
  try {
    console.log('Looking for organic product with slug:', req.params.slug);
    const product = await OrganicProduct.findOne({ 
      slug: req.params.slug, 
      isVisible: true 
    });

    console.log('Found product:', product ? product.title : 'Not found');

    if (!product) {
      return res.status(404).render('public/404', {
        title: 'Product Not Found'
      });
    }

    const stories = await getActiveStories();
    const baseUrl = getSiteUrl(res.locals.siteSettings);
    const pageUrl = `${baseUrl}/organic-products/${product.slug}`;
    const productDescription = product.shortDescription || product.fullDescription || product.title;
    const faqQuestions = [
      {
        question: `What is ${product.title}?`,
        answer: productDescription
      },
      {
        question: `Who should use ${product.title}?`,
        answer: `Anyone looking for ${product.title.toLowerCase()} in the ${product.category.toLowerCase()} category.`
      },
      {
        question: 'How can I inquire about this product?',
        answer: 'Use the inquiry button on this page or send a WhatsApp message to request pricing, delivery, and availability details.'
      }
    ];

    // Fetch reviews for this product
    const Review = require('../models/Review');
    const reviews = await Review.find({
      productId: product._id,
      productType: 'organic',
      isHidden: { $ne: true }
    }).sort({ createdAt: -1 });

    res.render('public/product-detail-template', {
      title: `${product.title} - Swadesi Carts`,
      product,
      type: 'organic',
      stories,
      currentPage: 'organic',
      seo: {
        title: product.seoTitle || `${product.title} - Swadesi Carts`,
        description: product.seoMetaDescription || product.shortDescription || product.fullDescription || product.title,
        keywords: [product.seoKeywords, product.geoKeywords, product.longTailKeywords].filter(Boolean).join(', '),
        canonical: pageUrl,
        ogType: 'product',
        ogImage: product.featuredImage && product.featuredImage.url ? product.featuredImage.url : '',
        geoKeywords: product.geoKeywords || '',
        aiSearchPhrases: product.aiSearchPhrases || ''
      },
      schemaJsonLd: [
        toJsonLd(productSchema({
          name: product.title,
          description: productDescription,
          url: pageUrl,
          image: product.featuredImage && product.featuredImage.url ? product.featuredImage.url : '',
          category: product.category,
          sku: product.slug,
          offers: product.price ? {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.price,
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          } : undefined
        })),
        toJsonLd(breadcrumbSchema([
          { name: 'Home', url: baseUrl + '/' },
          { name: 'Organic Products', url: baseUrl + '/organic-products' },
          { name: product.title, url: pageUrl }
        ])),
        toJsonLd(faqSchema(faqQuestions))
      ],
      reviews,
      success: res.locals.success,
      error: res.locals.error
    });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).send('Server Error');
  }
};

// Submit inquiry
// Submit inquiry from inquiry page
exports.submitInquiry = async (req, res) => {
  try {
    const { name, mobile, email, requirement, productId } = req.body;
    
    const product = await OrganicProduct.findById(productId);
    
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/organic-products/inquiry');
    }

    const ticket = await Ticket.create({
      name,
      mobile,
      email,
      user: req.session.userId || null,
      subject: `Inquiry for ${product.title}`,
      productType: 'organic',
      productId: product._id,
      productModel: 'OrganicProduct',
      productTitle: product.title,
      messages: [{
        sender: 'user',
        senderName: name,
        message: requirement
      }]
    });

    // Send confirmation email
    const subject = `[${ticket.ticketNumber}] We received your inquiry`;
    const html = `<p>Hello ${name},</p>
                  <p>Thank you for inquiring about <strong>${product.title}</strong>.</p>
                  <p>A support ticket has been opened for you: <strong>${ticket.ticketNumber}</strong>.</p>
                  <p>Our team will review your requirement and get back to you shortly.</p>
                  <hr>
                  <p><em>You can reply directly to this email to add more information to your ticket.</em></p>`;
    await sendEmail(email, subject, html).catch(err => console.error('Failed to send ticket email:', err));

    req.flash('success', `Inquiry submitted successfully! Your ticket number is ${ticket.ticketNumber}. Check your email.`);
    res.redirect('/organic-products/' + product.slug);
  } catch (error) {
    console.error('Inquiry submission error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('back');
  }
};

// Get inquiry page
exports.getInquiryPage = async (req, res) => {
  try {
    const products = await OrganicProduct.find({ isVisible: true })
      .select('_id title price shortDescription category slug featuredImage')
      .sort({ title: 1 });

    const selectedProductId = req.query.productId || '';
    const selectedProduct = selectedProductId
      ? products.find(product => product._id.toString() === selectedProductId.toString()) || null
      : null;
    const baseUrl = getSiteUrl(res.locals.siteSettings);

    res.render('public/organic-inquiry', {
      title: 'Organic Product Inquiry - Swadesi Carts',
      products,
      selectedProductId,
      selectedProduct,
      seo: {
        title: 'Organic Product Inquiry - Swadesi Carts',
        description: selectedProduct ? `Inquiry form for ${selectedProduct.title} on Swadesi Carts.` : 'Send an inquiry for organic products on Swadesi Carts.',
        canonical: `${baseUrl}/organic-products/inquiry`,
        keywords: 'organic inquiry, organic products, Swadesi Carts',
        ogType: 'article'
      },
      inquiryPrefill: selectedProduct ? {
        productId: selectedProduct._id.toString(),
        productTitle: selectedProduct.title,
        productCategory: selectedProduct.category,
        productPrice: selectedProduct.price ? `₹${selectedProduct.price}` : '',
        productDescription: selectedProduct.shortDescription || '',
        productType: 'organic',
        packageName: '',
        autoRequirement: true
      } : {},
      currentPage: 'organic'
    });
  } catch (error) {
    console.error('Inquiry page error:', error);
    res.status(500).send('Server Error');
  }
};
