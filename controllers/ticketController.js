const Ticket = require('../models/Ticket');
const sendEmail = require('../helpers/email');
const { uploadTicketAttachment } = require('../helpers/uploadToCloudinary');

// Get all tickets for logged in user
exports.getUserTickets = async (req, res) => {
  try {
    // Redirect to the profile page where the tickets tab is located
    res.redirect('/profile?tab=tickets');
  } catch (error) {
    console.error('Error redirecting to profile tickets:', error);
    res.redirect('/profile');
  }
};

// View single ticket
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ 
      ticketNumber: req.params.ticketNumber,
      user: req.session.userId 
    });

    if (!ticket) {
      req.flash('error', 'Ticket not found');
      return res.redirect('/tickets');
    }

    res.render('public/ticket-detail', {
      title: `Ticket ${ticket.ticketNumber} - Swadesi Carts`,
      ticket,
      currentPage: 'profile'
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    req.flash('error', 'Could not load ticket details');
    res.redirect('/tickets');
  }
};

// Reply to a ticket as User
exports.replyTicketUser = async (req, res) => {
  try {
    const message = (req.body.message || '').trim();
    const files   = req.files || [];

    if (!message && files.length === 0) {
      return res.status(400).json({ success: false, message: 'Message or attachment required.' });
    }

    const ticket = await Ticket.findOne({ 
      ticketNumber: req.params.ticketNumber,
      user: req.session.userId 
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Upload attachments concurrently
    let attachments = [];
    if (files.length > 0) {
      attachments = await Promise.all(
        files.map(file => uploadTicketAttachment(file, {
          ticketNumber:    ticket.ticketNumber,
          uploadedByModel: 'User',
          uploadedById:    String(req.session.userId || '')
        }))
      );
    }

    ticket.messages.push({
      sender: 'user',
      senderName: req.session.userName,
      message: message || '',
      attachments
    });
    
    // Auto-reopen ticket if it was closed
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      ticket.status = 'open';
    }

    await ticket.save();
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(ticket.ticketNumber).emit('newMessage', ticket.messages[ticket.messages.length - 1]);
    }

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: ticket.messages[ticket.messages.length - 1] });
    }
    
    req.flash('success', 'Reply sent successfully');
    res.redirect(`/tickets/${ticket.ticketNumber}`);
  } catch (error) {
    console.error('Error replying to ticket:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Could not send reply.' });
    }
    req.flash('error', 'Could not send reply');
    res.redirect('back');
  }
};

// --- ADMIN CONTROLLERS ---

exports.getAdminTickets = async (req, res) => {
  try {
    const status = req.query.status || 'all';
    const search = req.query.search || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    let query = {};
    if (status !== 'all') query.status = status;

    if (search) {
      // First, find any registered users matching this search term (since we display their real names)
      const User = require('../models/User');
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } } // Match if the ticket belongs to a user who matches the search
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        let toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const tickets = await Ticket.find(query).populate('user').sort({ updatedAt: -1 });

    res.render('admin/tickets/index', {
      title: 'Ticket Management',
      tickets,
      currentStatus: status,
      currentSearch: search,
      currentStartDate: startDate,
      currentEndDate: endDate
    });
  } catch (error) {
    console.error('Admin ticket error:', error);
    req.flash('error', 'Could not load tickets');
    res.redirect('/admin/dashboard');
  }
};

exports.getAdminTicketDetail = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketNumber: req.params.ticketNumber });
    if (!ticket) {
      req.flash('error', 'Ticket not found');
      return res.redirect('/admin/tickets');
    }
    
    res.render('admin/tickets/view', {
      title: `View Ticket ${ticket.ticketNumber}`,
      ticket
    });
  } catch (error) {
    console.error('Admin ticket detail error:', error);
    res.redirect('/admin/tickets');
  }
};

exports.replyTicketAdmin = async (req, res) => {
  try {
    const message = (req.body.message || '').trim();
    const status  = req.body.status;
    const files   = req.files || [];
    
    const ticket = await Ticket.findOne({ ticketNumber: req.params.ticketNumber });
    if (!ticket) {
      return res.redirect('/admin/tickets');
    }

    // Upload attachments concurrently
    let attachments = [];
    if (files.length > 0) {
      attachments = await Promise.all(
        files.map(file => uploadTicketAttachment(file, {
          ticketNumber:    ticket.ticketNumber,
          uploadedByModel: 'Admin',
          uploadedById:    String(req.session.adminId || '')
        }))
      );
    }

    if (message || attachments.length > 0) {
      ticket.messages.push({
        sender: 'admin',
        senderName: req.session.adminName || 'Support Team',
        message: message || '',
        attachments
      });

      // Send email to the user so they see the reply!
      if (message) {
        const subject = `Re: [${ticket.ticketNumber}] ${ticket.subject}`;
        const html = `<p>Hello ${ticket.name},</p>
                      <p>Our support team has replied to your ticket <strong>${ticket.ticketNumber}</strong>:</p>
                      <div style="background:#f4f4f5; padding:15px; border-radius:8px; margin: 15px 0;">
                        <p style="margin:0;">${message}</p>
                      </div>
                      ${attachments.length > 0 ? `<p><em>${attachments.length} attachment(s) were also sent — view them in your ticket dashboard.</em></p>` : ''}
                      <p>To view your ticket online or reply, please visit your account dashboard, or simply reply directly to this email.</p>`;
        
        await sendEmail(ticket.email, subject, html).catch(err => console.error('Admin reply email failed:', err));
      }
    }

    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
    }

    await ticket.save();
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(ticket.ticketNumber).emit('newMessage', ticket.messages[ticket.messages.length - 1]);
    }

    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: ticket.messages[ticket.messages.length - 1] });
    }
    
    req.flash('success', 'Ticket updated successfully');
    res.redirect(`/admin/tickets/${ticket.ticketNumber}`);
  } catch (error) {
    console.error('Admin reply error:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Could not update ticket.' });
    }
    req.flash('error', 'Could not update ticket');
    res.redirect('back');
  }
};

// Delete single ticket
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the ticket' });
  }
};

// Bulk delete tickets
exports.bulkDeleteTickets = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No ticket IDs provided' });
    }
    await Ticket.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} tickets deleted successfully` });
  } catch (error) {
    console.error('Bulk delete tickets error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during bulk deletion' });
  }
};

