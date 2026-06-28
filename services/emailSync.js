const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const Ticket = require('../models/Ticket');
const { uploadBufferToCloudinary } = require('../helpers/uploadToCloudinary');
const { inferFileType } = require('../helpers/cloudinaryHelper');
const Media = require('../models/mediaModel');

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

const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
  'application/pdf'
];

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_ATTACHMENTS      = 5;

let connection = null;

const uploadEmailAttachment = async (attachment, ticketNumber, uploadedByModel) => {
  try {
    const mimeType = attachment.contentType || 'application/octet-stream';
    if (!ALLOWED_ATTACHMENT_TYPES.includes(mimeType)) {
      console.log(`[EmailSync] Skipping attachment "${attachment.filename}" – disallowed type: ${mimeType}`);
      return null;
    }

    const buffer = attachment.content; // Buffer from mailparser
    if (!buffer || buffer.length === 0) return null;
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      console.log(`[EmailSync] Skipping attachment "${attachment.filename}" – too large (${buffer.length} bytes)`);
      return null;
    }

    const resourceType = mimeType.startsWith('video/') ? 'video' : mimeType === 'application/pdf' ? 'raw' : 'image';

    const result = await uploadBufferToCloudinary(buffer, {
      resource_type: resourceType,
      mimeType,
      folder: `ticket-attachments/${ticketNumber}`,
      use_filename: true,
      unique_filename: true
    });

    const fileType = inferFileType(result.resource_type, result.format, mimeType);

    // Persist in Media collection
    await Media.findOneAndUpdate(
      { publicId: result.public_id },
      {
        publicId:        result.public_id,
        secureUrl:       result.secure_url,
        fileType,
        resourceType:    result.resource_type || 'image',
        format:          result.format || '',
        bytes:           result.bytes || 0,
        width:           result.width || 0,
        height:          result.height || 0,
        duration:        result.duration || 0,
        uploadedAt:      new Date(),
        relatedModel:    'Ticket',
        relatedId:       ticketNumber,
        usageSection:    'Ticket Attachment (Email)',
        usageLocations:  [{ relatedModel: 'Ticket', relatedId: ticketNumber, relatedTitle: `Ticket ${ticketNumber}`, usageSection: 'Ticket Attachment (Email)' }],
        isUsed:          true,
        lastSyncedAt:    new Date(),
        uploadedByModel: 'EmailSync',
        uploadedById:    ''
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      publicId: result.public_id,
      url:      result.secure_url,
      fileType,
      filename: attachment.filename || 'attachment',
      bytes:    result.bytes || 0
    };
  } catch (err) {
    console.error(`[EmailSync] Failed to upload attachment "${attachment.filename}":`, err.message);
    return null;
  }
};

const startEmailSync = async (app) => {
  try {
    connection = await imaps.connect(config);
    // Prevent socket errors from crashing the main Node.js process
    connection.on('error', (err) => {
      console.error('[EmailSync] Socket Error:', err.message);
    });

    await connection.openBox('INBOX');

    // Search for UNREAD emails with TKT- in the subject
    const searchCriteria = ['UNSEEN', ['SUBJECT', 'TKT-']];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    if (messages.length > 0) {
      console.log(`[EmailSync] Found ${messages.length} emails matching ticket format.`);
    }

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
          cleanMessage = cleanMessage.split(/\r?\n>/)[0].trim();

          const finalMessage = cleanMessage || text.trim();

          // Process email attachments (images, videos, PDFs only)
          const rawAttachments = Array.isArray(mail.attachments) ? mail.attachments.slice(0, MAX_ATTACHMENTS) : [];
          const isUserEmail = ticket.email.toLowerCase() === from.toLowerCase();
          const uploadedByModel = isUserEmail ? 'User' : 'Admin';

          const uploadedAttachments = (
            await Promise.all(rawAttachments.map(att => uploadEmailAttachment(att, ticketNumber, uploadedByModel)))
          ).filter(Boolean);

          // Prevent duplicate text messages (since we fetch all matching subjects now)
          const isDuplicateText = finalMessage && ticket.messages.some(m => m.message === finalMessage && m.attachments.length === 0);

          if (!isDuplicateText || uploadedAttachments.length > 0) {
            if (finalMessage || uploadedAttachments.length > 0) {
              ticket.messages.push({
                sender:      isUserEmail ? 'user' : 'admin',
                senderName:  isUserEmail ? ticket.name : 'Support Team',
                message:     finalMessage || '',
                attachments: uploadedAttachments,
                isEmailSync: true
              });

              if (ticket.status === 'closed' || ticket.status === 'resolved') {
                ticket.status = 'open'; // Reopen if they reply
              }

              await ticket.save();
              console.log(`[EmailSync] Successfully synced reply to ticket ${ticketNumber} (${uploadedAttachments.length} attachments)`);
              
              if (app) {
                const io = app.get('io');
                if (io) {
                  io.to(ticketNumber).emit('newMessage', ticket.messages[ticket.messages.length - 1]);
                }
              }
            }
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
