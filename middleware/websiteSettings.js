const WebsiteSetting = require('../models/WebsiteSetting');

// Middleware to load website settings for all views
const loadWebsiteSettings = async (req, res, next) => {
  try {
    let settings = await WebsiteSetting.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new WebsiteSetting({
        about: {
          values: [
            {
              icon: '🌟',
              title: 'Quality',
              description: 'We never compromise on quality. Every product is carefully selected and tested.'
            },
            {
              icon: '✓',
              title: 'Authenticity',
              description: 'All products come with proper certifications and guarantees.'
            },
            {
              icon: '💙',
              title: 'Customer Care',
              description: 'Your satisfaction is our priority. We\'re always here to help.'
            },
            {
              icon: '🚀',
              title: 'Innovation',
              description: 'We continuously improve our services and offerings.'
            }
          ]
        }
      });
      await settings.save();
    }
    
    // Make settings available to all views
    res.locals.siteSettings = settings;
    next();
  } catch (error) {
    console.error('Error loading website settings:', error);
    // Continue even if settings can't be loaded
    res.locals.siteSettings = null;
    next();
  }
};

module.exports = { loadWebsiteSettings };
