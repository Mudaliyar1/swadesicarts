const OrganicProduct = require('../../models/OrganicProduct');
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');

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

exports.list = async (req, res) => {
  try {
    const products = await OrganicProduct.find().sort({ order: 1, createdAt: -1 });
    
    res.render('admin/organic/list', {
      title: 'Organic Products',
      products,
      adminName: req.session.adminName,
      currentPage: 'organic',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).send('Server Error');
  }
};

exports.showCreate = (req, res) => {
  res.render('admin/organic/create', {
    title: 'Add Organic Product',
    adminName: req.session.adminName,
    currentPage: 'organic',
    error: req.flash('error')
  });
};

exports.create = async (req, res) => {
  try {
    const { title, category, shortDescription, fullDescription, benefits, certifications, inStock, isVisible, order } = req.body;

    const productData = {
      title,
      category,
      shortDescription,
      fullDescription,
      benefits: benefits ? (Array.isArray(benefits) ? benefits : [benefits]) : [],
      certifications: certifications ? certifications.split(',').map(c => ({ name: c.trim() })) : [],
      inStock: inStock === 'on',
      isVisible: isVisible === 'on',
      order: parseInt(order) || 0
    };

    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      const result = await uploadToCloudinary(req.files.featuredImage[0].buffer, 'organic');
      productData.featuredImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    if (req.files && req.files.gallery) {
      productData.gallery = [];
      for (const file of req.files.gallery) {
        const result = await uploadToCloudinary(file.buffer, 'organic/gallery');
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        productData.gallery.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: fileType
        });
      }
    }

    await OrganicProduct.create(productData);

    req.flash('success', 'Product created successfully');
    res.redirect('/admin/organic-products');
  } catch (error) {
    console.error('Create error:', error);
    req.flash('error', error.message || 'An error occurred while creating the product');
    res.redirect('/admin/organic-products/create');
  }
};

exports.showEdit = async (req, res) => {
  try {
    const product = await OrganicProduct.findById(req.params.id);
    
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/organic-products');
    }

    res.render('admin/organic/edit', {
      title: 'Edit Organic Product',
      product,
      adminName: req.session.adminName,
      currentPage: 'organic',
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Show edit error:', error);
    req.flash('error', 'An error occurred');
    res.redirect('/admin/organic-products');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, category, shortDescription, fullDescription, benefits, certifications, inStock, isVisible, order } = req.body;
    
    const product = await OrganicProduct.findById(req.params.id);
    
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/organic-products');
    }

    product.title = title;
    product.category = category;
    product.shortDescription = shortDescription;
    product.fullDescription = fullDescription;
    product.benefits = benefits ? (Array.isArray(benefits) ? benefits : [benefits]) : [];
    product.certifications = certifications ? certifications.split(',').map(c => ({ name: c.trim() })) : [];
    product.inStock = inStock === 'on';
    product.isVisible = isVisible === 'on';
    product.order = parseInt(order) || 0;

    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      if (product.featuredImage && product.featuredImage.publicId) {
        await cloudinary.uploader.destroy(product.featuredImage.publicId);
      }
      
      const result = await uploadToCloudinary(req.files.featuredImage[0].buffer, 'organic');
      product.featuredImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    if (req.files && req.files.gallery) {
      for (const file of req.files.gallery) {
        const result = await uploadToCloudinary(file.buffer, 'organic/gallery');
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
    res.redirect('/admin/organic-products');
  } catch (error) {
    console.error('Update error:', error);
    req.flash('error', 'An error occurred while updating the product');
    res.redirect(`/admin/organic-products/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const product = await OrganicProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.featuredImage && product.featuredImage.publicId) {
      try {
        const resourceType = product.featuredImage.type === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(product.featuredImage.publicId, { resource_type: resourceType });
      } catch (err) {
        console.error('Error deleting featured image from Cloudinary:', err);
      }
    }

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

    await OrganicProduct.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the product' });
  }
};

exports.deleteGalleryItem = async (req, res) => {
  try {
    const { productId, itemId } = req.params;
    
    const product = await OrganicProduct.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const galleryItem = product.gallery.id(itemId);
    
    if (!galleryItem) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

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
