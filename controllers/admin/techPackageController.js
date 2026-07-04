const TechPackage = require('../../models/TechPackage');
const cloudinary = require('../../config/cloudinary');
const streamifier = require('streamifier');
const geoHelper = require('../../helpers/geoHelper');

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
      if (status === 'available') filter.isAvailable = true;
      if (status === 'unavailable') filter.isAvailable = false;
    }

    // Sorting
    let sort = { order: 1, createdAt: -1 }; // default sorting
    if (sortBy) {
      const direction = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'price') {
        sort = { 'price.amount': direction, createdAt: -1 };
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

    const totalProducts = await TechPackage.countDocuments(filter);
    const products = await TechPackage.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get unique categories for the filter dropdown
    const categories = await TechPackage.distinct('category');

    res.render('admin/tech/list', {
      title: 'Tech Packages',
      products,
      categories,
      adminName: req.session.adminName,
      currentPage: 'tech',
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

exports.showCreate = (req, res) => {
  res.render('admin/tech/create', {
    title: 'Add Tech Package',
    adminName: req.session.adminName,
    currentPage: 'tech',
    error: req.flash('error')
  });
};

exports.create = async (req, res) => {
  try {
    const { title, category, shortDescription, fullDescription, features, priceAmount, isAvailable, isVisible, order, slug, seoTitle, seoMetaDescription, seoKeywords, geoKeywords, longTailKeywords, aiSearchPhrases, geoSummary, aiDescription, aiKeywords, aiCategoryDescription, entityDescription } = req.body;

    let packageData = {
      title,
      slug: slug ? slug.trim() : undefined,
      category,
      shortDescription,
      fullDescription,
      features: features ? (Array.isArray(features) ? features : [features]) : [],
      price: {
        amount: parseFloat(priceAmount) || 0,
        displayText: priceAmount ? `₹${parseFloat(priceAmount).toLocaleString('en-IN')}` : ''
      },
      isAvailable: isAvailable === 'on',
      isVisible: typeof isVisible === 'undefined' ? true : isVisible === 'on',
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

    packageData = geoHelper.autoFillGeoFields(packageData, 'tech');

    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      const result = await uploadToCloudinary(req.files.featuredImage[0].buffer, 'tech');
      packageData.featuredImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    if (req.files && req.files.gallery) {
      packageData.gallery = [];
      for (const file of req.files.gallery) {
        const result = await uploadToCloudinary(file.buffer, 'tech/gallery');
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        packageData.gallery.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: fileType
        });
      }
    }

    await TechPackage.create(packageData);

    req.flash('success', 'Package created successfully');
    res.redirect('/admin/tech-packages');
  } catch (error) {
    console.error('Create error:', error);
    if (error.code === 11000) {
      req.flash('error', 'A package with this URL slug already exists. Please choose a different title or slug.');
    } else {
      req.flash('error', 'An error occurred while creating the package');
    }
    res.redirect('/admin/tech-packages/create');
  }
};

exports.showEdit = async (req, res) => {
  try {
    const product = await TechPackage.findById(req.params.id);
    
    if (!product) {
      req.flash('error', 'Package not found');
      return res.redirect('/admin/tech-packages');
    }

    res.render('admin/tech/edit', {
      title: 'Edit Tech Package',
      product,
      adminName: req.session.adminName,
      currentPage: 'tech',
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Show edit error:', error);
    req.flash('error', 'An error occurred');
    res.redirect('/admin/tech-packages');
  }
};

exports.update = async (req, res) => {
  try {
    const { title, category, shortDescription, fullDescription, features, priceAmount, isAvailable, isVisible, order, slug, seoTitle, seoMetaDescription, seoKeywords, geoKeywords, longTailKeywords, aiSearchPhrases, geoSummary, aiDescription, aiKeywords, aiCategoryDescription, entityDescription } = req.body;
    
    const pkg = await TechPackage.findById(req.params.id);
    
    if (!pkg) {
      req.flash('error', 'Package not found');
      return res.redirect('/admin/tech-packages');
    }

    pkg.title = title;
    if (slug && slug.trim()) pkg.slug = slug.trim();
    pkg.category = category;
    pkg.shortDescription = shortDescription;
    pkg.fullDescription = fullDescription;
    pkg.features = features ? (Array.isArray(features) ? features : [features]) : [];
    pkg.price = {
      amount: parseFloat(priceAmount) || 0,
      displayText: priceAmount ? `₹${parseFloat(priceAmount).toLocaleString('en-IN')}` : ''
    };
    pkg.isAvailable = isAvailable === 'on';
    if (typeof isVisible !== 'undefined') {
      pkg.isVisible = isVisible === 'on';
    }
    pkg.order = parseInt(order) || 0;
    pkg.seoTitle = seoTitle || '';
    pkg.seoMetaDescription = seoMetaDescription || '';
    pkg.seoKeywords = seoKeywords || '';
    pkg.geoKeywords = geoKeywords || '';
    pkg.longTailKeywords = longTailKeywords || '';
    pkg.aiSearchPhrases = aiSearchPhrases || '';
    pkg.geoSummary = geoSummary || '';
    pkg.aiDescription = aiDescription || '';
    pkg.aiKeywords = aiKeywords || '';
    pkg.aiCategoryDescription = aiCategoryDescription || '';
    pkg.entityDescription = entityDescription || '';

    geoHelper.autoFillGeoFields(pkg, 'tech');

    if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
      if (pkg.featuredImage && pkg.featuredImage.publicId) {
        await cloudinary.uploader.destroy(pkg.featuredImage.publicId);
      }
      
      const result = await uploadToCloudinary(req.files.featuredImage[0].buffer, 'tech');
      pkg.featuredImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    if (req.files && req.files.gallery) {
      for (const file of req.files.gallery) {
        const result = await uploadToCloudinary(file.buffer, 'tech/gallery');
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        pkg.gallery.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: fileType
        });
      }
    }

    await pkg.save();

    req.flash('success', 'Package updated successfully');
    res.redirect('/admin/tech-packages');
  } catch (error) {
    console.error('Update error:', error);
    if (error.code === 11000) {
      req.flash('error', 'A package with this URL slug already exists. Please choose a different title or slug.');
    } else {
      req.flash('error', 'An error occurred while updating the package');
    }
    res.redirect(`/admin/tech-packages/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const pkg = await TechPackage.findById(req.params.id);
    
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Delete from DB first for instant user response
    await TechPackage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Package deleted successfully' });

    // Clean up images in background
    setImmediate(async () => {
      // Delete featured image from Cloudinary
      if (pkg.featuredImage && pkg.featuredImage.publicId) {
        try {
          const resourceType = pkg.featuredImage.type === 'video' ? 'video' : 'image';
          await cloudinary.uploader.destroy(pkg.featuredImage.publicId, { resource_type: resourceType });
        } catch (err) {
          console.error('Error deleting featured image from Cloudinary:', err);
        }
      }

      // Delete gallery images from Cloudinary
      if (pkg.gallery && pkg.gallery.length > 0) {
        for (const media of pkg.gallery) {
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
    res.status(500).json({ success: false, message: 'An error occurred while deleting the package' });
  }
};

exports.deleteGalleryItem = async (req, res) => {
  try {
    const { productId, itemId } = req.params;
    
    const pkg = await TechPackage.findById(productId);
    
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const galleryItem = pkg.gallery.id(itemId);
    
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

    pkg.gallery.pull(itemId);
    await pkg.save();

    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Delete gallery item error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

// Bulk delete packages
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No package IDs provided' });
    }

    const packages = await TechPackage.find({ _id: { $in: ids } });

    // Delete from DB first for instant user response
    await TechPackage.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${packages.length} packages deleted successfully` });

    // Clean up images in background
    setImmediate(async () => {
      for (const pkg of packages) {
        // Delete featured image
        if (pkg.featuredImage && pkg.featuredImage.publicId) {
          try {
            const resourceType = pkg.featuredImage.type === 'video' ? 'video' : 'image';
            await cloudinary.uploader.destroy(pkg.featuredImage.publicId, { resource_type: resourceType });
          } catch (err) {
            console.error('Error deleting featured image from Cloudinary:', err);
          }
        }

        // Delete gallery images
        if (pkg.gallery && pkg.gallery.length > 0) {
          for (const media of pkg.gallery) {
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
