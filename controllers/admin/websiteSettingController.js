const WebsiteSetting = require('../../models/WebsiteSetting');
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Get or create website settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();
    
    // If no settings exist, create default settings
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
    
    res.render('admin/settings/edit', {
      title: 'Website Settings',
      settings,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    req.flash('error', 'Error loading settings');
    res.redirect('/admin/dashboard');
  }
};

// Update website settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await WebsiteSetting.findOne();
    if (!settings) {
      settings = new WebsiteSetting();
    }

    // Update footer settings
    settings.footer = {
      phone: req.body['footer.phone'] || settings.footer.phone,
      email: req.body['footer.email'] || settings.footer.email,
      address: req.body['footer.address'] || settings.footer.address,
      description: req.body['footer.description'] || settings.footer.description
    };

    // Update contact settings
    settings.contact = {
      heading: req.body['contact.heading'] || settings.contact.heading,
      subheading: req.body['contact.subheading'] || settings.contact.subheading,
      location: req.body['contact.location'] || settings.contact.location,
      email: req.body['contact.email'] || settings.contact.email,
      phone: req.body['contact.phone'] || settings.contact.phone,
      businessHours: {
        days: req.body['contact.businessHours.days'] || settings.contact.businessHours.days,
        time: req.body['contact.businessHours.time'] || settings.contact.businessHours.time
      }
    };

    // Update social media links
    settings.socialMedia = {
      facebook: req.body['socialMedia.facebook'] || '',
      twitter: req.body['socialMedia.twitter'] || '',
      instagram: req.body['socialMedia.instagram'] || '',
      linkedin: req.body['socialMedia.linkedin'] || '',
      youtube: req.body['socialMedia.youtube'] || ''
    };

    // Update about settings
    settings.about.mainHeading = req.body['about.mainHeading'] || settings.about.mainHeading;
    settings.about.headerDescription = req.body['about.headerDescription'] || settings.about.headerDescription;
    settings.about.description = req.body['about.description'] || settings.about.description;
    settings.about.valuesHeading = req.body['about.valuesHeading'] || settings.about.valuesHeading;
    settings.about.valuesSubheading = req.body['about.valuesSubheading'] || settings.about.valuesSubheading;
    settings.about.ctaHeading = req.body['about.ctaHeading'] || settings.about.ctaHeading;
    settings.about.ctaDescription = req.body['about.ctaDescription'] || settings.about.ctaDescription;

    // Update values
    if (req.body.values && Array.isArray(req.body.values)) {
      settings.about.values = req.body.values.map(value => ({
        icon: value.icon || '🌟',
        title: value.title || '',
        description: value.description || ''
      }));
    }

    // Update statistics
    settings.about.stats = {
      customers: req.body['stats.customers'] || settings.about.stats.customers,
      customersLabel: req.body['stats.customersLabel'] || settings.about.stats.customersLabel,
      products: req.body['stats.products'] || settings.about.stats.products,
      productsLabel: req.body['stats.productsLabel'] || settings.about.stats.productsLabel,
      experience: req.body['stats.experience'] || settings.about.stats.experience,
      experienceLabel: req.body['stats.experienceLabel'] || settings.about.stats.experienceLabel,
      satisfaction: req.body['stats.satisfaction'] || settings.about.stats.satisfaction,
      satisfactionLabel: req.body['stats.satisfactionLabel'] || settings.about.stats.satisfactionLabel
    };

    // Handle logo upload
    if (req.files && req.files.logo && req.files.logo[0]) {
      // Delete old logo if exists
      if (settings.logo.publicId) {
        await cloudinary.uploader.destroy(settings.logo.publicId);
      }
      
      const result = await uploadToCloudinary(req.files.logo[0].buffer, 'swadesi-carts/settings');
      
      settings.logo.url = result.secure_url;
      settings.logo.publicId = result.public_id;
    }

    // Update logo size and position settings
    if (req.body['logo.width']) {
      settings.logo.width = parseInt(req.body['logo.width']) || 200;
    }
    if (req.body['logo.height']) {
      settings.logo.height = parseInt(req.body['logo.height']) || 50;
    }
    if (req.body['logo.horizontalPosition']) {
      settings.logo.horizontalPosition = parseInt(req.body['logo.horizontalPosition']) || 0;
    }
    if (req.body['logo.verticalPosition']) {
      settings.logo.verticalPosition = parseInt(req.body['logo.verticalPosition']) || 0;
    }

    // Handle about image upload
    if (req.files && req.files.aboutImage && req.files.aboutImage[0]) {
      // Delete old image if exists
      if (settings.about.image.publicId) {
        await cloudinary.uploader.destroy(settings.about.image.publicId);
      }
      
      const result = await uploadToCloudinary(req.files.aboutImage[0].buffer, 'swadesi-carts/settings');
      
      settings.about.image = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    await settings.save();
    
    req.flash('success', 'Website settings updated successfully');
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Error updating settings:', error);
    req.flash('error', 'Error updating settings: ' + error.message);
    res.redirect('/admin/settings');
  }
};

// Delete logo
exports.deleteLogo = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    if (settings.logo.publicId) {
      await cloudinary.uploader.destroy(settings.logo.publicId);
    }

    settings.logo.url = '';
    settings.logo.publicId = '';
    await settings.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return res.status(500).json({ success: false, message: 'Error deleting logo' });
  }
};

// Delete about image
exports.deleteAboutImage = async (req, res) => {
  try {
    const settings = await WebsiteSetting.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    if (settings.about.image.publicId) {
      await cloudinary.uploader.destroy(settings.about.image.publicId);
    }

    settings.about.image.url = '';
    settings.about.image.publicId = '';
    await settings.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting about image:', error);
    return res.status(500).json({ success: false, message: 'Error deleting about image' });
  }
};
