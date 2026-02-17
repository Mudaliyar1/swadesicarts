const mongoose = require('mongoose');

const websiteSettingSchema = new mongoose.Schema({
  // Logo
  logo: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 50 },
    horizontalPosition: { type: Number, default: 0, min: -100, max: 100 },
    verticalPosition: { type: Number, default: 0, min: -100, max: 100 }
  },

  // Header Settings
  header: {
    height: { type: Number, default: 72 } // Header height in pixels
  },

  // Color Scheme
  colors: {
    primary: { type: String, default: '#4C1E4F' }, // Header/Footer color
    accent: { type: String, default: '#B5A886' },  // Accent/highlight color
    secondary: { type: String, default: '#6C8E7F' }, // Secondary elements
    headingText: { type: String, default: '#2c3e50' }, // Heading/Title text color
    bodyText: { type: String, default: '#495057' }, // Body/Content text color
    linkColor: { type: String, default: '#B5A886' }, // Link color for general content
    headerFooterLinkColor: { type: String, default: '#FFD700' } // Link color for header/footer
  },

  // Footer Settings
  footer: {
    phone: { type: String, default: '+91-000-0000000' },
    email: { type: String, default: 'info@swadesicarts.com' },
    address: { type: String, default: 'India' },
    description: { type: String, default: 'Your trusted partner for organic and seasonal products' }
  },

  // Contact Page Settings
  contact: {
    heading: { type: String, default: "We'd love to hear from you. Get in touch with us today!" },
    subheading: { type: String, default: 'Get In Touch' },
    location: { type: String, default: 'India' },
    email: { type: String, default: 'info@swadesicarts.com' },
    phone: { type: String, default: '+91-000-0000000' },
    businessHours: {
      days: { type: String, default: 'Monday - Saturday' },
      time: { type: String, default: '9:00 AM - 6:00 PM IST' }
    }
  },

  // WhatsApp Chat Settings
  whatsapp: {
    number: { type: String, default: '' },
    message: { type: String, default: 'Hello! I would like to know more about your products.' }
  },

  // Visitor Modal Settings
  visitorModal: {
    enabled: { type: Boolean, default: true }
  },

  // Social Media Links
  socialMedia: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },

  // About Page Settings
  about: {
    mainHeading: { type: String, default: 'About Swadesi Carts' },
    headerDescription: { type: String, default: 'Your trusted partner for authentic products and professional solutions' },
    description: { type: String, default: 'We are committed to providing the best products and services.' },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    },
    // Values Section
    valuesHeading: { type: String, default: 'Our Values' },
    valuesSubheading: { type: String, default: 'What drives us forward' },
    values: [
      {
        icon: { type: String, default: '🌟' },
        title: { type: String },
        description: { type: String }
      }
    ],
    // Statistics
    stats: {
      customers: { type: String, default: '500+' },
      customersLabel: { type: String, default: 'Happy Customers' },
      products: { type: String, default: '1000+' },
      productsLabel: { type: String, default: 'Products & Services' },
      experience: { type: String, default: '10+' },
      experienceLabel: { type: String, default: 'Years Experience' },
      satisfaction: { type: String, default: '100%' },
      satisfactionLabel: { type: String, default: 'Satisfaction Guaranteed' }
    },
    // Call to Action
    ctaHeading: { type: String, default: 'Ready to Experience Excellence?' },
    ctaDescription: { type: String, default: 'Join our community of satisfied customers and discover the Swadesi Carts difference.' },
    // Team Members
    teamHeading: { type: String, default: 'Meet Our Team' },
    teamSubheading: { type: String, default: 'The people behind the excellence' },
    teamMembers: [
      {
        name: { type: String, required: true },
        role: { type: String, required: true },
        bio: { type: String, default: '' },
        image: {
          url: { type: String, default: '' },
          publicId: { type: String, default: '' }
        },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 }
      }
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WebsiteSetting', websiteSettingSchema);
