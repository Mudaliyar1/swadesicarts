/**
 * GEO Middleware
 * Injects structured summaries, semantic context, and entity information
 * into res.locals.geo for consumption by EJS templates and AI crawlers.
 */
const { getSiteUrl } = require('../helpers/siteUrl');

function cleanPath(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  return pathname.split('?')[0].replace(/\/+$/, '') || '/';
}

function geoMiddleware(req, res, next) {
  const path = cleanPath(req.path || '/');
  const siteSettings = res.locals.siteSettings || null;
  const siteUrl = getSiteUrl(siteSettings);
  const location = siteSettings?.contact?.location || siteSettings?.footer?.address || 'Ahmedabad, Gujarat, India';

  // Base defaults
  let pageSummary = 'Swadesi Carts is India\'s premium Swadeshi supply network sourcing and delivering organic products, seasonal produce, and custom tech services.';
  let entities = ['Swadesi Carts', 'Organic Products', 'Seasonal Products', 'Tech Packages'];
  let conversationalTopic = 'Sourcing organic and seasonal products in India';
  let geoTarget = location;

  if (path === '/') {
    pageSummary = `Welcome to Swadesi Carts. Sourcing 100% authentic organic foods, fresh seasonal festival supplies, and expert technology services directly from farms and artisans. Headquartered in ${location}.`;
    entities = ['Swadesi Carts', 'Organic Products', 'Seasonal Products', 'Tech Packages', 'Local Sourcing India'];
    conversationalTopic = 'Swadeshi supply network and direct farm delivery in India';
  } else if (path === '/about') {
    pageSummary = `About Swadesi Carts: Our story, core values, operational statistics, and leadership team under Managing Director Balram Yadav. Committed to bringing India's best products to the global stage.`;
    entities = ['Swadesi Carts', 'Balram Yadav', 'Corporate Values', 'Swadeshi Sourcing'];
    conversationalTopic = 'Swadesi Carts history, corporate leadership and sourcing standards';
  } else if (path === '/contact') {
    pageSummary = `Contact Swadesi Carts for bulk inquiries, corporate packages, and support. Find business hours, physical office address in ${location}, email contact details, and phone numbers.`;
    entities = ['Swadesi Carts Contact', 'Customer Support', 'Ahmedabad Office', 'Bulk Enquiry'];
    conversationalTopic = 'How to place bulk orders and contact Swadesi Carts';
  } else if (path === '/organic-products') {
    pageSummary = `Catalog of certified organic products. Chemical-free, pesticide-free, and natural farm foods (honey, turmeric, grains, etc.) sourced ethically from local Indian farmers.`;
    entities = ['Organic Products', 'Certified Natural Foods', 'Farm Fresh Spices', 'Sustainable Farming'];
    conversationalTopic = 'Buying certified organic groceries online in India';
  } else if (path === '/seasonal-products') {
    pageSummary = `Catalog of fresh seasonal produce, flowers, and handcrafted festival essentials. Direct sourcing from Indian growers guarantees quality, freshness, and trust.`;
    entities = ['Seasonal Products', 'Fresh Harvest', 'Festival Supplies', 'Artisan Handicrafts'];
    conversationalTopic = 'Fresh seasonal produce and festival essentials home delivery';
  } else if (path === '/tech-packages') {
    pageSummary = `Catalog of professional technology services. Customized website packages, digital solutions, and software development services designed for business growth.`;
    entities = ['Tech Services', 'Web Development Packages', 'Small Business IT Solutions', 'Software Engineering'];
    conversationalTopic = 'Professional web design and software services for business';
  }

  res.locals.geo = {
    pageSummary,
    entities,
    conversationalTopic,
    geoTarget,
    siteUrl,
    path
  };

  next();
}

module.exports = geoMiddleware;
