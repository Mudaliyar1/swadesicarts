const SeasonalProduct = require('../models/SeasonalProduct');
const TechPackage = require('../models/TechPackage');
const OrganicProduct = require('../models/OrganicProduct');
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

// Home page
exports.getHome = async (req, res) => {
  try {
    const featuredSeasonal = await SeasonalProduct.find({ isVisible: true })
      .select('title slug category shortDescription featuredImage order')
      .sort({ order: 1 })
      .limit(3);
    
    const featuredTech = await TechPackage.find()
      .select('title slug category shortDescription featuredImage price order')
      .sort({ order: 1 })
      .limit(3);
    
    const featuredOrganic = await OrganicProduct.find({ isVisible: true })
      .select('title slug category shortDescription featuredImage order')
      .sort({ order: 1 })
      .limit(3);

    const stories = await getActiveStories();

    res.render('public/home-new', {
      title: 'Swadesi Carts - Home',
      featuredSeasonal,
      featuredTech,
      featuredOrganic,
      stories,
      currentPage: 'home'
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).send('Server Error');
  }
};

// About page
exports.getAbout = async (req, res) => {
  try {
    const stories = await getActiveStories();
    res.render('public/about-new', {
      title: 'About Us - Swadesi Carts',
      stories,
      currentPage: 'about'
    });
  } catch (error) {
    console.error('About page error:', error);
    res.status(500).send('Server Error');
  }
};

// Contact page
exports.getContact = async (req, res) => {
  try {
    const stories = await getActiveStories();
    res.render('public/contact-new', {
      title: 'Contact Us - Swadesi Carts',
      stories,
      currentPage: 'contact',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Contact page error:', error);
    res.status(500).send('Server Error');
  }
};

// Handle contact form
exports.postContact = async (req, res) => {
  try {
    const Inquiry = require('../models/Inquiry');
    const { name, mobile, email, requirement } = req.body;

    await Inquiry.create({
      name,
      mobile,
      email,
      requirement,
      productType: 'general'
    });

    req.flash('success', 'Thank you for contacting us! We will get back to you soon.');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/contact');
  }
};
