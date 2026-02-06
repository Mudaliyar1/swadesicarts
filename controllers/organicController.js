const OrganicProduct = require('../models/OrganicProduct');
const Inquiry = require('../models/Inquiry');

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

    res.render('public/organic-products-new', {
      title: 'Organic Products - Swadesi Carts',
      products,
      categories: categories.sort(),
      selectedCategory,
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

    res.render('public/product-detail-template', {
      title: `${product.title} - Swadesi Carts`,
      product,
      type: 'organic',
      currentPage: 'organic',
      success: req.flash('success'),
      error: req.flash('error')
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

    await Inquiry.create({
      name,
      mobile,
      email,
      requirement,
      productType: 'organic',
      productId: product._id,
      productModel: 'OrganicProduct',
      productTitle: product.title
    });

    res.render('public/inquiry-success', {
      title: 'Inquiry Submitted - Swadesi Carts',
      productType: 'organic',
      currentPage: 'organic'
    });
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
      .select('_id title price')
      .sort({ title: 1 });

    const selectedProductId = req.query.productId || '';

    res.render('public/organic-inquiry', {
      title: 'Organic Product Inquiry - Swadesi Carts',
      products,
      selectedProductId,
      currentPage: 'organic'
    });
  } catch (error) {
    console.error('Inquiry page error:', error);
    res.status(500).send('Server Error');
  }
};
