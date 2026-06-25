const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { isUserAuthenticated } = require('../middleware/auth');

// Public User Routes
// Note: We use the isUserAuthenticated middleware to ensure only logged in users can see their tickets
router.get('/', isUserAuthenticated, ticketController.getUserTickets);
router.get('/:ticketNumber', isUserAuthenticated, ticketController.getTicket);
router.post('/:ticketNumber/reply', isUserAuthenticated, ticketController.replyTicketUser);

module.exports = router;
