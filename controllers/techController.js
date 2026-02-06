const TechPackage = require('../models/TechPackage');
const Inquiry = require('../models/Inquiry');

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

    res.render('public/tech-packages-new', {
      title: 'Tech Services & Packages - Swadesi Carts',
      packages,
      categories: categories.sort(),
      selectedCategory,
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

    res.render('public/product-detail-template', {
      title: `${package.title} - Swadesi Carts`,
      product: package,
      type: 'tech',
      currentPage: 'tech',
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

    await Inquiry.create({
      name,
      mobile,
      email,
      requirement,
      productType: 'tech',
      productId: package._id,
      productModel: 'TechPackage',
      productTitle: package.title
    });

    res.render('public/inquiry-success', {
      title: 'Inquiry Submitted - Swadesi Carts',
      productType: 'tech',
      currentPage: 'tech'
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
    const packages = await TechPackage.find()
      .select('_id title price')
      .sort({ title: 1 });

    const selectedProductId = req.query.productId || '';

    res.render('public/tech-inquiry', {
      title: 'Tech Package Inquiry - Swadesi Carts',
      products: packages,
      selectedProductId,
      currentPage: 'tech'
    });
  } catch (error) {
    console.error('Inquiry page error:', error);
    res.status(500).send('Server Error');
  }
};
