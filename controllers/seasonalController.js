const SeasonalProduct = require('../models/SeasonalProduct');
const Inquiry = require('../models/Inquiry');
const Story = require('../models/Story');

// Helper function to get active stories
async function getActiveStories() {
  try {
    return await Story.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

// Get all seasonal products
exports.getAllProducts = async (req, res) => {
  try {
    const selectedCategory = req.query.category || '';
    
    // Get all unique categories
    const categories = await SeasonalProduct.distinct('category', { isVisible: true });
    
    // Build query
    const query = { isVisible: true };
    if (selectedCategory) {
      query.category = selectedCategory;
    }
    
    const products = await SeasonalProduct.find(query)
      .sort({ order: 1, createdAt: -1 });

    const stories = await getActiveStories();

    res.render('public/seasonal-products-new', {
      title: 'Seasonal Products - Swadesi Carts',
      products,
      categories: categories.sort(),
      selectedCategory,
      stories,
      currentPage: 'seasonal'
    });
  } catch (error) {
    console.error('Seasonal products error:', error);
    res.status(500).send('Server Error');
  }
};

// Get single product detail
exports.getProductDetail = async (req, res) => {
  try {
    console.log('Looking for seasonal product with slug:', req.params.slug);
    const product = await SeasonalProduct.findOne({ 
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

    res.render('public/product-detail-template', {
      title: `${product.title} - Swadesi Carts`,
      product,
      type: 'seasonal',
      stories,
      currentPage: 'seasonal',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).send('Server Error');
  }
};

// Submit inquiry
exports.submitInquiry = async (req, res) => {
  try {
    const { name, mobile, email, requirement, productId } = req.body;
    
    const product = await SeasonalProduct.findById(productId);
    
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/seasonal-products');
    }

    await Inquiry.create({
      name,
      mobile,
      email,
      requirement,
      productType: 'seasonal',
      productId: product._id,
      productModel: 'SeasonalProduct',
      productTitle: product.title
    });

    req.flash('success', 'Your inquiry has been submitted successfully! We will contact you soon.');
    res.redirect(`/seasonal-products/${product.slug}`);
  } catch (error) {
    console.error('Inquiry submission error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('back');
  }
};

// Get inquiry page
exports.getInquiryPage = async (req, res) => {
  try {
    const products = await SeasonalProduct.find({ isVisible: true })
      .select('_id title price')
      .sort({ title: 1 });

    const selectedProductId = req.query.productId || '';

    res.render('public/seasonal-inquiry', {
      title: 'Seasonal Product Inquiry - Swadesi Carts',
      products,
      selectedProductId,
      currentPage: 'seasonal'
    });
  } catch (error) {
    console.error('Inquiry page error:', error);
    res.status(500).send('Server Error');
  }
};

// Submit inquiry from inquiry page
exports.submitInquiry = async (req, res) => {
  try {
    const { name, mobile, email, requirement, productId } = req.body;
    
    const product = await SeasonalProduct.findById(productId);
    
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/seasonal-products/inquiry');
    }

    await Inquiry.create({
      name,
      mobile,
      email,
      requirement,
      productType: 'seasonal',
      productId: product._id,
      productModel: 'SeasonalProduct',
      productTitle: product.title
    });

    res.render('public/inquiry-success', {
      title: 'Inquiry Submitted - Swadesi Carts',
      productType: 'seasonal',
      currentPage: 'seasonal'
    });
  } catch (error) {
    console.error('Inquiry submission error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('back');
  }
};
