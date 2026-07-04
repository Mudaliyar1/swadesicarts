const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { isUserAuthenticated } = require('../middleware/auth');
const { ticketAttachmentUpload, validateAttachmentMagicNumbers } = require('../middleware/ticketAttachmentUpload');
const { doubleCsrfProtection } = require('../middleware/csrfProtection');

// Public User Routes
// Note: We use the isUserAuthenticated middleware to ensure only logged in users can see their tickets
router.get('/', isUserAuthenticated, ticketController.getUserTickets);
router.get('/:ticketNumber', isUserAuthenticated, ticketController.getTicket);
router.post(
  '/:ticketNumber/reply',
  isUserAuthenticated,
  ticketAttachmentUpload.array('attachments', 5),
  validateAttachmentMagicNumbers,
  doubleCsrfProtection,
  ticketController.replyTicketUser
);

module.exports = router;
