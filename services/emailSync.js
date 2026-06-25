const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const Ticket = require('../models/Ticket');

// IMAP Configuration
const config = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 10000,
    tlsOptions: { rejectUnauthorized: false }
  }
};

let connection = null;

const startEmailSync = async (app) => {
  try {
    console.log('[EmailSync] Connecting to IMAP server...');
    connection = await imaps.connect(config);
    
    // Prevent socket errors from crashing the main Node.js process
    connection.on('error', (err) => {
      console.error('[EmailSync] Socket Error:', err.message);
    });

    console.log('[EmailSync] Successfully connected. Opening INBOX...');

    await connection.openBox('INBOX');

    // Search for UNREAD emails with TKT- in the subject
    const searchCriteria = ['UNSEEN', ['SUBJECT', 'TKT-']];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`[EmailSync] Found ${messages.length} emails matching ticket format.`);

    for (const msg of messages) {
      const all = msg.parts.find(part => part.which === '');
      const id = msg.attributes.uid;
      const idHeader = "Imap-Id: "+id+"\r\n";

      const mail = await simpleParser(idHeader + all.body);
      const subject = mail.subject || '';
      const text = mail.text || '';
      const from = mail.from.value[0].address;

      console.log(`[EmailSync] Processing Email: "${subject}" from ${from}`);

      // Check if this is a reply to a ticket (e.g., "[TKT-1234-ABCD] We received your inquiry")
      const ticketMatch = subject.match(/\[(TKT-[0-9]{4}-[A-Z0-9]{4})\]/i);
      
      if (ticketMatch) {
        const ticketNumber = ticketMatch[1].toUpperCase();
        console.log(`[EmailSync] Extracted Ticket ID: ${ticketNumber}`);

        const ticket = await Ticket.findOne({ ticketNumber });
        if (ticket) {
          // Clean the reply (remove original quoted text - handles multi-line)
          let cleanMessage = text.split(/On [\s\S]*?wrote:/i)[0].trim();
          cleanMessage = cleanMessage.split(/From:[\s\S]*?Sent:/i)[0].trim();
          cleanMessage = cleanMessage.split(/From: /)[0].trim();
          cleanMessage = cleanMessage.split(/\r?\n>/)[0].trim(); // Only split if > is at the start of a line
          cleanMessage = cleanMessage.split(/\r?\n>/)[0].trim(); // Only split if > is at the start of a line

          const finalMessage = cleanMessage || text.trim();

          // Prevent duplicate messages (since we are fetching all matching subjects now)
          const isDuplicate = ticket.messages.some(m => m.message === finalMessage);

          if (!isDuplicate && finalMessage) {
            ticket.messages.push({
              sender: ticket.email.toLowerCase() === from.toLowerCase() ? 'user' : 'admin',
              senderName: ticket.email.toLowerCase() === from.toLowerCase() ? ticket.name : 'Support Team',
              message: finalMessage,
              isEmailSync: true
            });

            if (ticket.status === 'closed' || ticket.status === 'resolved') {
              ticket.status = 'open'; // Reopen if they reply
            }

            await ticket.save();
            console.log(`[EmailSync] Successfully synced reply to ticket ${ticketNumber}`);
            
            if (app) {
              const io = app.get('io');
              if (io) {
                io.to(ticketNumber).emit('newMessage', ticket.messages[ticket.messages.length - 1]);
              }
            }
          } else {
             // Silently ignore duplicates
          }
        } else {
          console.log(`[EmailSync] Ticket ${ticketNumber} not found in DB. Ignored.`);
        }
      } else {
        console.log('[EmailSync] Not a ticket reply. Ignored.');
      }
    }

    // Disconnect and schedule next run
    connection.end();
  } catch (error) {
    console.error('[EmailSync] Error connecting to IMAP:', error);
  } finally {
    // Run again in 10 seconds for faster syncing
    setTimeout(() => startEmailSync(app), 10000);
  }
};

module.exports = startEmailSync;
