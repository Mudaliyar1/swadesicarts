const SeasonalProduct = require('../models/SeasonalProduct');
const TechPackage = require('../models/TechPackage');
const OrganicProduct = require('../models/OrganicProduct');
const Story = require('../models/Story');
const Company = require('../models/companyModel');
const { getSiteUrl } = require('../helpers/siteUrl');
const { organizationSchema, breadcrumbSchema, toJsonLd } = require('../helpers/schemaHelper');

function buildSeo({ title, description, path, keywords = '', ogType = 'website', baseUrl }) {
  const canonical = `${baseUrl || getSiteUrl()}${path}`;
  return {
    title,
    description,
    keywords,
    canonical,
    ogType,
    ogSiteName: 'Swadesi Carts',
    twitterCard: 'summary_large_image',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  };
}

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
    const baseUrl = getSiteUrl(res.locals.siteSettings);
    const featuredSeasonal = await SeasonalProduct.find({ isVisible: true })
      .select('title slug category shortDescription featuredImage price priceUnit minOrderQuantity minOrderUnit order')
      .sort({ order: 1 })
      .limit(3);
    
    const featuredTech = await TechPackage.find()
      .select('title slug category shortDescription featuredImage price order')
      .sort({ order: 1 })
      .limit(3);
    
    const featuredOrganic = await OrganicProduct.find({ isVisible: true })
      .select('title slug category shortDescription featuredImage price priceUnit minOrderQuantity minOrderUnit order')
      .sort({ order: 1 })
      .limit(3);

    const companies = await Company.find({ isVisible: true })
      .select('name logo shortDescription fullDescription websiteUrl isFeatured isVisible createdAt')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(12);

    const stories = await getActiveStories();

    // Dynamically build advanced schemas
    const homeBreadcrumb = breadcrumbSchema([
      { name: 'Home', url: baseUrl + '/' }
    ]);
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Swadesi Carts",
      "url": baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/organic-products?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
    const orgSchema = organizationSchema({
      name: 'Swadesi Carts',
      url: baseUrl,
      description: 'Premium organic products, fresh seasonal produce, and professional tech packages from Swadesi Carts.',
      logo: `${baseUrl}/favicon.svg`
    });
    const localBizSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Swadesi Carts",
      "image": `${baseUrl}/favicon.svg`,
      "telephone": res.locals.siteSettings?.contact?.phone || '+91-XXXX-XXXXXX',
      "email": res.locals.siteSettings?.contact?.email || 'info@swadesicarts.in',
      "address": {
        "@type": "PostalAddress",
        "streetAddress": res.locals.siteSettings?.contact?.location || 'Ahmedabad, Gujarat, India',
        "addressLocality": "Ahmedabad",
        "addressRegion": "Gujarat",
        "addressCountry": "IN"
      },
      "url": baseUrl
    };

    res.render('public/home-new', {
      title: 'Swadesi Carts - Home',
      seo: buildSeo({
        title: 'Swadesi Carts - Organic, Seasonal & Tech Products',
        description: 'Premium organic products, fresh seasonal produce, and professional tech packages from Swadesi Carts.',
        path: '/',
        keywords: 'Swadesi Carts, organic products India, seasonal produce India, tech packages India',
        baseUrl
      }),
      featuredSeasonal,
      featuredTech,
      featuredOrganic,
      companies,
      stories,
      currentPage: 'home',
      schemaJsonLd: [
        toJsonLd(websiteSchema),
        toJsonLd(orgSchema),
        toJsonLd(localBizSchema),
        toJsonLd(homeBreadcrumb)
      ]
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
    const baseUrl = getSiteUrl(res.locals.siteSettings);

    const aboutBreadcrumb = breadcrumbSchema([
      { name: 'Home', url: baseUrl + '/' },
      { name: 'About Us', url: baseUrl + '/about' }
    ]);
    const aboutPageSchema = {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Swadesi Carts",
      "description": "Learn about Swadesi Carts, our mission, values, and the team behind our organic, seasonal, and tech products.",
      "url": `${baseUrl}/about`
    };

    res.render('public/about-new', {
      title: 'About Us - Swadesi Carts',
      seo: buildSeo({
        title: 'About Us - Swadesi Carts',
        description: 'Learn about Swadesi Carts, our mission, values, and the people behind our organic, seasonal, and tech services.',
        path: '/about',
        keywords: 'about Swadesi Carts, mission, values, team',
        baseUrl,
        ogType: 'article'
      }),
      stories,
      currentPage: 'about',
      schemaJsonLd: [
        toJsonLd(aboutPageSchema),
        toJsonLd(aboutBreadcrumb)
      ]
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
    const baseUrl = getSiteUrl(res.locals.siteSettings);

    const contactBreadcrumb = breadcrumbSchema([
      { name: 'Home', url: baseUrl + '/' },
      { name: 'Contact Us', url: baseUrl + '/contact' }
    ]);
    const contactPageSchema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Swadesi Carts",
      "description": "Contact Swadesi Carts for organic products, seasonal produce, tech packages, and business inquiries.",
      "url": `${baseUrl}/contact`
    };
    const localBizSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Swadesi Carts",
      "image": `${baseUrl}/favicon.svg`,
      "telephone": res.locals.siteSettings?.contact?.phone || '+91-XXXX-XXXXXX',
      "email": res.locals.siteSettings?.contact?.email || 'info@swadesicarts.in',
      "address": {
        "@type": "PostalAddress",
        "streetAddress": res.locals.siteSettings?.contact?.location || 'Ahmedabad, Gujarat, India',
        "addressLocality": "Ahmedabad",
        "addressRegion": "Gujarat",
        "addressCountry": "IN"
      },
      "url": baseUrl
    };

    res.render('public/contact-new', {
      title: 'Contact Us - Swadesi Carts',
      seo: buildSeo({
        title: 'Contact Us - Swadesi Carts',
        description: 'Contact Swadesi Carts for organic products, seasonal produce, tech packages, and business inquiries.',
        path: '/contact',
        keywords: 'contact Swadesi Carts, inquiry, support, business contact',
        baseUrl,
        ogType: 'article'
      }),
      stories,
      currentPage: 'contact',
      success: req.flash('success'),
      error: req.flash('error'),
      schemaJsonLd: [
        toJsonLd(contactPageSchema),
        toJsonLd(localBizSchema),
        toJsonLd(contactBreadcrumb)
      ]
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
