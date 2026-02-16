const SeasonalProduct = require('../../models/SeasonalProduct');
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `swadesi-carts/${folder}`, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// List all products
exports.list = async (req, res) => {
  try {
    const products = await SeasonalProduct.find().sort({ order: 1, createdAt: -1 });
    
    res.render('admin/seasonal/list', {
      title: 'Seasonal Products',
      products,
      adminName: req.session.adminName,
      currentPage: 'seasonal',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).send('Server Error');
  }
};

// Show create form
exports.showCreate = (req, res) => {
  res.render('admin/seasonal/create', {
    title: 'Add Seasonal Product',
    adminName: req.session.adminName,
    currentPage: 'seasonal',
    error: req.flash('error')
  });
};

// Create product
exports.create = async (req, res) => {
  try {
    const { title, category, shortDescription, fullDescription, isVisible, order } = req.body;

    const productData = {
      title,
      category,
      shortDescription,
      fullDescription,
      isVisible: isVisible === 'on',
      order: parseInt(order) || 0
    };

    // Upload featured image
    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      const result = await uploadToCloudinary(req.files.featuredImage[0].buffer, 'seasonal');
      productData.featuredImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    // Upload gallery images
    if (req.files && req.files.gallery) {
      productData.gallery = [];
      for (const file of req.files.gallery) {
        const result = await uploadToCloudinary(file.buffer, 'seasonal/gallery');
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        productData.gallery.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: fileType
        });
      }
    }

    await SeasonalProduct.create(productData);

    req.flash('success', 'Product created successfully');
    res.redirect('/admin/seasonal-products');
  } catch (error) {
    console.error('Create error:', error);
    req.flash('error', 'An error occurred while creating the product');
    res.redirect('/admin/seasonal-products/create');
  }
};

// Show edit form
exports.showEdit = async (req, res) => {
  try {
    const product = await SeasonalProduct.findById(req.params.id);
    
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/seasonal-products');
    }

    res.render('admin/seasonal/edit', {
      title: 'Edit Seasonal Product',
      product,
      adminName: req.session.adminName,
      currentPage: 'seasonal',
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Show edit error:', error);
    req.flash('error', 'An error occurred');
    res.redirect('/admin/seasonal-products');
  }
};

// Update product
exports.update = async (req, res) => {
  try {
    const { title, category, shortDescription, fullDescription, isVisible, order } = req.body;
    
    const product = await SeasonalProduct.findById(req.params.id);
    
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/seasonal-products');
    }

    product.title = title;
    product.category = category;
    product.shortDescription = shortDescription;
    product.fullDescription = fullDescription;
    product.isVisible = isVisible === 'on';
    product.order = parseInt(order) || 0;

    // Update featured image if new one uploaded
    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      // Delete old image
      if (product.featuredImage && product.featuredImage.publicId) {
        await cloudinary.uploader.destroy(product.featuredImage.publicId);
      }
      
      const result = await uploadToCloudinary(req.files.featuredImage[0].buffer, 'seasonal');
      product.featuredImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    // Add new gallery images
    if (req.files && req.files.gallery) {
      for (const file of req.files.gallery) {
        const result = await uploadToCloudinary(file.buffer, 'seasonal/gallery');
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        product.gallery.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: fileType
        });
      }
    }

    await product.save();

    req.flash('success', 'Product updated successfully');
    res.redirect('/admin/seasonal-products');
  } catch (error) {
    console.error('Update error:', error);
    req.flash('error', 'An error occurred while updating the product');
    res.redirect(`/admin/seasonal-products/edit/${req.params.id}`);
  }
};

// Delete product
exports.delete = async (req, res) => {
  try {
    const product = await SeasonalProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete featured image from Cloudinary
    if (product.featuredImage && product.featuredImage.publicId) {
      try {
        const resourceType = product.featuredImage.type === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(product.featuredImage.publicId, { resource_type: resourceType });
      } catch (err) {
        console.error('Error deleting featured image from Cloudinary:', err);
      }
    }

    // Delete gallery images from Cloudinary
    if (product.gallery && product.gallery.length > 0) {
      for (const media of product.gallery) {
        if (media.publicId) {
          try {
            const resourceType = media.type === 'video' ? 'video' : 'image';
            await cloudinary.uploader.destroy(media.publicId, { resource_type: resourceType });
          } catch (err) {
            console.error('Error deleting gallery item from Cloudinary:', err);
          }
        }
      }
    }

    await SeasonalProduct.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the product' });
  }
};

// Delete gallery item
exports.deleteGalleryItem = async (req, res) => {
  try {
    const { productId, itemId } = req.params;
    
    const product = await SeasonalProduct.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const galleryItem = product.gallery.id(itemId);
    
    if (!galleryItem) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    // Delete from Cloudinary
    if (galleryItem.publicId) {
      try {
        const resourceType = galleryItem.type === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(galleryItem.publicId, { resource_type: resourceType });
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }
    }

    product.gallery.pull(itemId);
    await product.save();

    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Delete gallery item error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
