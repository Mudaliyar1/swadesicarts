const WebsiteSetting = require('../models/WebsiteSetting');

// Middleware to load website settings for all views
const loadWebsiteSettings = async (req, res, next) => {
  try {
    let settings = await WebsiteSetting.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new WebsiteSetting({
        about: {
          teamMembers: [],
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
    
    // Ensure teamMembers array exists
    if (settings && settings.about && !settings.about.teamMembers) {
      settings.about.teamMembers = [];
      await settings.save();
    }
    
    // Ensure colors exist with defaults
    if (settings && !settings.colors) {
      settings.colors = {
        primary: '#4C1E4F',
        accent: '#B5A886',
        secondary: '#6C8E7F',
        headingText: '#2c3e50',
        bodyText: '#495057',
        linkColor: '#B5A886',
        headerFooterLinkColor: '#FFD700'
      };
      await settings.save();
    } else if (settings && settings.colors) {
      // Ensure text colors exist in existing color objects
      if (!settings.colors.headingText) {
        settings.colors.headingText = '#2c3e50';
        await settings.save();
      }
      if (!settings.colors.bodyText) {
        settings.colors.bodyText = '#495057';
        await settings.save();
      }
      if (!settings.colors.linkColor) {
        settings.colors.linkColor = '#B5A886';
        await settings.save();
      }
      if (!settings.colors.headerFooterLinkColor) {
        settings.colors.headerFooterLinkColor = '#FFD700';
        await settings.save();
      }
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
