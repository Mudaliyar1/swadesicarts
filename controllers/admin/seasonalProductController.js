const SeasonalProduct = require('../../models/SeasonalProduct');
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');
const geoHelper = require('../../helpers/geoHelper');

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, category, status, sortBy, sortOrder } = req.query;

    const filter = {};

    // Search query (matches title or category case-insensitively)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { category: searchRegex }
      ];
    }

    // Category filter
    if (category && category.trim() && category !== 'all') {
      filter.category = category.trim();
    }

    // Status filter
    if (status) {
      if (status === 'visible') filter.isVisible = true;
      if (status === 'hidden') filter.isVisible = false;
      if (status === 'inStock') filter.inStock = true;
      if (status === 'outOfStock') filter.inStock = false;
    }

    // Sorting
    let sort = { order: 1, createdAt: -1 }; // default sorting
    if (sortBy) {
      const direction = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'price') {
        sort = { price: direction, createdAt: -1 };
      } else if (sortBy === 'title') {
        sort = { title: direction, createdAt: -1 };
      } else if (sortBy === 'order') {
        sort = { order: direction, createdAt: -1 };
      } else if (sortBy === 'date') {
        sort = { createdAt: direction };
      } else {
        sort = { [sortBy]: direction };
      }
    }

    const totalProducts = await SeasonalProduct.countDocuments(filter);
    const products = await SeasonalProduct.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get unique categories for the filter dropdown
    const categories = await SeasonalProduct.distinct('category');

    res.render('admin/seasonal/list', {
      title: 'Seasonal Products',
      products,
      categories,
      adminName: req.session.adminName,
      currentPage: 'seasonal',
      success: req.flash('success'),
      error: req.flash('error'),
      query: {
        page,
        limit,
        search: search || '',
        category: category || 'all',
        status: status || '',
        sortBy: sortBy || 'order',
        sortOrder: sortOrder || 'asc'
      },
      pagination: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        hasNextPage: page * limit < totalProducts,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      }
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
    const { title, category, shortDescription, fullDescription, price, priceUnit, minOrderQuantity, minOrderUnit, isVisible, order, inStock, stockQuantity, slug, seoTitle, seoMetaDescription, seoKeywords, geoKeywords, longTailKeywords, aiSearchPhrases, geoSummary, aiDescription, aiKeywords, aiCategoryDescription, entityDescription } = req.body;

    let productData = {
      title,
      slug: slug ? slug.trim() : undefined,
      category,
      shortDescription,
      fullDescription,
      price: parseFloat(price) || undefined,
      priceUnit: priceUnit || '',
      minOrderQuantity: parseInt(minOrderQuantity) || 1,
      minOrderUnit: minOrderUnit || '',
      inStock: inStock === 'on',
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
      isVisible: isVisible === 'on',
      order: parseInt(order) || 0,
      seoTitle: seoTitle || '',
      seoMetaDescription: seoMetaDescription || '',
      seoKeywords: seoKeywords || '',
      geoKeywords: geoKeywords || '',
      longTailKeywords: longTailKeywords || '',
      aiSearchPhrases: aiSearchPhrases || '',
      geoSummary: geoSummary || '',
      aiDescription: aiDescription || '',
      aiKeywords: aiKeywords || '',
      aiCategoryDescription: aiCategoryDescription || '',
      entityDescription: entityDescription || ''
    };

    productData = geoHelper.autoFillGeoFields(productData, 'seasonal');

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
    if (error.code === 11000) {
      req.flash('error', 'A product with this URL slug already exists. Please choose a different title or slug.');
    } else {
      req.flash('error', 'An error occurred while creating the product');
    }
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
    const { title, category, shortDescription, fullDescription, price, priceUnit, minOrderQuantity, minOrderUnit, isVisible, order, inStock, stockQuantity, slug, seoTitle, seoMetaDescription, seoKeywords, geoKeywords, longTailKeywords, aiSearchPhrases, geoSummary, aiDescription, aiKeywords, aiCategoryDescription, entityDescription } = req.body;
    
    const product = await SeasonalProduct.findById(req.params.id);
    
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/seasonal-products');
    }

    product.title = title;
    if (slug && slug.trim()) product.slug = slug.trim();
    product.category = category;
    product.shortDescription = shortDescription;
    product.fullDescription = fullDescription;
    product.price = parseFloat(price) || undefined;
    product.priceUnit = priceUnit || '';
    product.minOrderQuantity = parseInt(minOrderQuantity) || 1;
    product.minOrderUnit = minOrderUnit || '';
    product.inStock = inStock === 'on';
    product.stockQuantity = stockQuantity ? parseInt(stockQuantity) : null;
    product.isVisible = isVisible === 'on';
    product.order = parseInt(order) || 0;
    product.seoTitle = seoTitle || '';
    product.seoMetaDescription = seoMetaDescription || '';
    product.seoKeywords = seoKeywords || '';
    product.geoKeywords = geoKeywords || '';
    product.longTailKeywords = longTailKeywords || '';
    product.aiSearchPhrases = aiSearchPhrases || '';
    product.geoSummary = geoSummary || '';
    product.aiDescription = aiDescription || '';
    product.aiKeywords = aiKeywords || '';
    product.aiCategoryDescription = aiCategoryDescription || '';
    product.entityDescription = entityDescription || '';

    geoHelper.autoFillGeoFields(product, 'seasonal');

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
    if (error.code === 11000) {
      req.flash('error', 'A product with this URL slug already exists. Please choose a different title or slug.');
    } else {
      req.flash('error', 'An error occurred while updating the product');
    }
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

    // Delete from DB first for instant user response
    await SeasonalProduct.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });

    // Clean up images in background
    setImmediate(async () => {
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
    });
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

// Bulk delete products
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No product IDs provided' });
    }

    const products = await SeasonalProduct.find({ _id: { $in: ids } });

    // Delete from DB first for instant user response
    await SeasonalProduct.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${products.length} products deleted successfully` });

    // Clean up images in background
    setImmediate(async () => {
      for (const product of products) {
        // Delete featured image
        if (product.featuredImage && product.featuredImage.publicId) {
          try {
            const resourceType = product.featuredImage.type === 'video' ? 'video' : 'image';
            await cloudinary.uploader.destroy(product.featuredImage.publicId, { resource_type: resourceType });
          } catch (err) {
            console.error('Error deleting featured image from Cloudinary:', err);
          }
        }

        // Delete gallery images
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
      }
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during bulk deletion' });
  }
};
