const Inquiry = require('../../models/Inquiry');
const PDFDocument = require('pdfkit');

exports.list = async (req, res) => {
  try {
    const { status, productType, fromDate, toDate } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (productType && productType !== 'all') {
      query.productType = productType;
    }
    
    if (fromDate) {
      query.createdAt = { $gte: new Date(fromDate) };
    }
    
    if (toDate) {
      query.createdAt = { ...query.createdAt, $lte: new Date(toDate) };
    }

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });

    res.render('admin/inquiries/list', {
      title: 'Inquiries',
      inquiries,
      filters: { status, productType, fromDate, toDate },
      adminName: req.session.adminName,
      currentPage: 'inquiries',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).send('Server Error');
  }
};

exports.view = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) {
      req.flash('error', 'Inquiry not found');
      return res.redirect('/admin/inquiries');
    }

    res.render('admin/inquiries/view', {
      title: 'Inquiry Details',
      inquiry,
      adminName: req.session.adminName,
      currentPage: 'inquiries',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('View error:', error);
    res.status(500).send('Server Error');
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    const inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    inquiry.status = status;
    if (adminNotes) {
      inquiry.adminNotes = adminNotes;
    }
    
    await inquiry.save();

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

exports.delete = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) {
      req.flash('error', 'Inquiry not found');
      return res.redirect('/admin/inquiries');
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inquiry-${inquiry._id}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(24)
       .text('Swadesi Carts', { align: 'center' })
       .fontSize(16)
       .text('Inquiry Details', { align: 'center' })
       .moveDown();

    // Inquiry Info
    doc.fontSize(12)
       .text(`Inquiry ID: ${inquiry._id}`)
       .text(`Date: ${inquiry.createdAt.toLocaleDateString()}`)
       .text(`Status: ${inquiry.status.toUpperCase()}`)
       .text(`Product Type: ${inquiry.productType}`)
       .moveDown();

    if (inquiry.productTitle) {
      doc.text(`Product: ${inquiry.productTitle}`)
         .moveDown();
    }

    // Customer Info
    doc.fontSize(14)
       .text('Customer Information')
       .fontSize(12)
       .text(`Name: ${inquiry.name}`)
       .text(`Mobile: ${inquiry.mobile}`)
       .text(`Email: ${inquiry.email}`)
       .moveDown();

    // Requirement
    doc.fontSize(14)
       .text('Requirement')
       .fontSize(12)
       .text(inquiry.requirement, { align: 'justify' })
       .moveDown();

    // Admin Notes
    if (inquiry.adminNotes) {
      doc.fontSize(14)
         .text('Admin Notes')
         .fontSize(12)
         .text(inquiry.adminNotes, { align: 'justify' });
    }

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    req.flash('error', 'An error occurred while generating PDF');
    res.redirect('/admin/inquiries');
  }
};
