const Company = require('../models/companyModel');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const normalizeCompanyUrl = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }
  return `https://${trimmed}`.replace(/\/+$/, '');
};

exports.list = async (req, res) => {
  try {
    const companies = await Company.find().sort({ isFeatured: -1, isVisible: -1, createdAt: -1 });

    res.render('admin/companies/list', {
      title: 'Companies We Worked With',
      companies,
      currentPage: 'companies',
      adminName: req.session.adminName,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Error loading companies:', error);
    req.flash('error', 'Error loading companies');
    res.redirect('/admin/dashboard');
  }
};

exports.showCreate = async (req, res) => {
  try {
    res.render('admin/companies/create', {
      title: 'Add Company',
      currentPage: 'companies',
      adminName: req.session.adminName,
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Error loading company create form:', error);
    req.flash('error', 'Error loading company form');
    res.redirect('/admin/companies');
  }
};

exports.create = async (req, res) => {
  try {
    const { name, shortDescription, fullDescription, websiteUrl, isFeatured, isVisible } = req.body;

    if (!name || !name.trim()) {
      req.flash('error', 'Company name is required');
      return res.redirect('/admin/companies/create');
    }

    if (!req.files || !req.files.logo || !req.files.logo[0]) {
      req.flash('error', 'Company logo is required');
      return res.redirect('/admin/companies/create');
    }

    const uploadResult = await uploadToCloudinary(req.files.logo[0].buffer, 'swadesi-carts/companies');

    await Company.create({
      name: name.trim(),
      logo: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id
      },
      shortDescription: shortDescription ? shortDescription.trim() : '',
      fullDescription: fullDescription ? fullDescription.trim() : '',
      websiteUrl: normalizeCompanyUrl(websiteUrl),
      isFeatured: isFeatured === 'on' || isFeatured === 'true',
      isVisible: isVisible === 'on' || isVisible === 'true'
    });

    req.flash('success', 'Company added successfully');
    res.redirect('/admin/companies');
  } catch (error) {
    console.error('Error creating company:', error);
    req.flash('error', 'Error creating company: ' + error.message);
    res.redirect('/admin/companies/create');
  }
};

exports.showEdit = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      req.flash('error', 'Company not found');
      return res.redirect('/admin/companies');
    }

    res.render('admin/companies/edit', {
      title: 'Edit Company',
      company,
      currentPage: 'companies',
      adminName: req.session.adminName,
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Error loading company edit form:', error);
    req.flash('error', 'Error loading company form');
    res.redirect('/admin/companies');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, shortDescription, fullDescription, websiteUrl, isFeatured, isVisible } = req.body;
    const company = await Company.findById(req.params.id);

    if (!company) {
      req.flash('error', 'Company not found');
      return res.redirect('/admin/companies');
    }

    if (!name || !name.trim()) {
      req.flash('error', 'Company name is required');
      return res.redirect(`/admin/companies/edit/${req.params.id}`);
    }

    company.name = name.trim();
    company.shortDescription = shortDescription ? shortDescription.trim() : '';
    company.fullDescription = fullDescription ? fullDescription.trim() : '';
    company.websiteUrl = normalizeCompanyUrl(websiteUrl);
    company.isFeatured = isFeatured === 'on' || isFeatured === 'true';
    company.isVisible = isVisible === 'on' || isVisible === 'true';

    if (req.files && req.files.logo && req.files.logo[0]) {
      if (company.logo && company.logo.publicId) {
        await cloudinary.uploader.destroy(company.logo.publicId, { resource_type: 'image' });
      }

      const uploadResult = await uploadToCloudinary(req.files.logo[0].buffer, 'swadesi-carts/companies');
      company.logo = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id
      };
    }

    await company.save();

    req.flash('success', 'Company updated successfully');
    res.redirect('/admin/companies');
  } catch (error) {
    console.error('Error updating company:', error);
    req.flash('error', 'Error updating company: ' + error.message);
    res.redirect(`/admin/companies/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (company.logo && company.logo.publicId) {
      try {
        await cloudinary.uploader.destroy(company.logo.publicId, { resource_type: 'image' });
      } catch (cloudinaryError) {
        console.error('Error deleting company logo from Cloudinary:', cloudinaryError);
      }
    }

    await Company.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return res.status(500).json({ success: false, message: 'Error deleting company' });
  }
};

exports.toggleVisibility = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    company.isVisible = !company.isVisible;
    await company.save();

    return res.json({
      success: true,
      message: `Company ${company.isVisible ? 'made visible' : 'hidden'}`,
      isVisible: company.isVisible
    });
  } catch (error) {
    console.error('Error toggling company visibility:', error);
    return res.status(500).json({ success: false, message: 'Error updating visibility' });
  }
};

exports.toggleFeatured = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    company.isFeatured = !company.isFeatured;
    await company.save();

    return res.json({
      success: true,
      message: `Company ${company.isFeatured ? 'featured' : 'unfeatured'}`,
      isFeatured: company.isFeatured
    });
  } catch (error) {
    console.error('Error toggling company featured status:', error);
    return res.status(500).json({ success: false, message: 'Error updating featured status' });
  }
};