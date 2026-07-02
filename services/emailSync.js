const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const Ticket = require('../models/Ticket');
const { uploadBufferToCloudinary } = require('../helpers/uploadToCloudinary');
const { inferFileType } = require('../helpers/cloudinaryHelper');
const Media = require('../models/mediaModel');

// IMAP Configuration — increased timeouts so Gmail doesn't drop us
const buildConfig = () => ({
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 30000,      // 30 seconds (was 10s)
    connTimeout: 60000,      // 60 seconds connection timeout (was missing entirely)
    tlsOptions: { rejectUnauthorized: false },
    keepalive: {
      interval: 10000,
      idleInterval: 300000,  // 5 minutes keepalive
      forceNoop: true
    }
  }
});

const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
  'application/pdf'
];

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_ATTACHMENTS      = 5;

// Sync interval & exponential backoff settings
const BASE_INTERVAL_MS = 60 * 1000;      // Check inbox every 60 seconds (was 10s causing spam)
const BASE_RETRY_DELAY = 30 * 1000;      // First retry after 30 seconds
const MAX_RETRY_DELAY  = 10 * 60 * 1000; // Max retry delay = 10 minutes

let retryDelay = BASE_RETRY_DELAY;
let retryTimer = null;
let connection = null;

const uploadEmailAttachment = async (attachment, ticketNumber) => {
  try {
    const mimeType = attachment.contentType || 'application/octet-stream';
    if (!ALLOWED_ATTACHMENT_TYPES.includes(mimeType)) {
      console.log(`[EmailSync] Skipping attachment "${attachment.filename}" – disallowed type: ${mimeType}`);
      return null;
    }

    const buffer = attachment.content;
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

const scheduleNext = (app, delay) => {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => startEmailSync(app), delay);
};

const startEmailSync = async (app) => {
  // Skip if IMAP credentials are not configured
  if (!process.env.IMAP_USER || !process.env.IMAP_PASS) {
    console.warn('[EmailSync] IMAP credentials not configured. Skipping email sync.');
    return;
  }

  try {
    connection = await imaps.connect(buildConfig());

    // Prevent unhandled socket errors from crashing the process
    connection.on('error', (err) => {
      if (err && err.source === 'timeout') return; // suppress noisy keepalive timeouts
      console.error('[EmailSync] Socket Error:', err.message);
    });

    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN', ['SUBJECT', 'TKT-']];
    const fetchOptions   = { bodies: ['HEADER', 'TEXT', ''], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    if (messages.length > 0) {
      console.log(`[EmailSync] Found ${messages.length} emails matching ticket format.`);
    }

    for (const msg of messages) {
      const all = msg.parts.find(part => part.which === '');
      const id = msg.attributes.uid;
      const idHeader = "Imap-Id: " + id + "\r\n";

      const mail    = await simpleParser(idHeader + all.body);
      const subject = mail.subject || '';
      const text    = mail.text || '';
      const from    = mail.from.value[0].address;

      console.log(`[EmailSync] Processing Email: "${subject}" from ${from}`);

      const ticketMatch = subject.match(/\[(TKT-[0-9]{4}-[A-Z0-9]{4})\]/i);

      if (ticketMatch) {
        const ticketNumber = ticketMatch[1].toUpperCase();
        console.log(`[EmailSync] Extracted Ticket ID: ${ticketNumber}`);

        const ticket = await Ticket.findOne({ ticketNumber });
        if (ticket) {
          // Strip quoted reply text
          let cleanMessage = text.split(/On [\s\S]*?wrote:/i)[0].trim();
          cleanMessage = cleanMessage.split(/From:[\s\S]*?Sent:/i)[0].trim();
          cleanMessage = cleanMessage.split(/From: /)[0].trim();
          cleanMessage = cleanMessage.split(/\r?\n>/)[0].trim();

          const finalMessage = cleanMessage || text.trim();

          const rawAttachments  = Array.isArray(mail.attachments) ? mail.attachments.slice(0, MAX_ATTACHMENTS) : [];
          const isUserEmail     = ticket.email.toLowerCase() === from.toLowerCase();

          const uploadedAttachments = (
            await Promise.all(rawAttachments.map(att => uploadEmailAttachment(att, ticketNumber)))
          ).filter(Boolean);

          const isDuplicateText = finalMessage && ticket.messages.some(
            m => m.message === finalMessage && m.attachments.length === 0
          );

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
                ticket.status = 'open';
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

    // Successful run — reset backoff counter
    retryDelay = BASE_RETRY_DELAY;

    // Close connection and schedule next normal check
    try { connection.end(); } catch (_) {}

  } catch (error) {
    const isTimeout = error.message && error.message.includes('timed out');
    if (isTimeout) {
      console.warn(`[EmailSync] IMAP connection timed out. Retrying in ${Math.round(retryDelay / 1000)}s.`);
    } else {
      console.error('[EmailSync] Error:', error.message);
    }

    // Clean up stale connection
    if (connection) {
      try { connection.end(); } catch (_) {}
      connection = null;
    }

    // Exponential backoff: 30s → 60s → 120s → ... → max 10 minutes
    scheduleNext(app, retryDelay);
    retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
    return;
  }

  // Schedule the next normal sync run
  scheduleNext(app, BASE_INTERVAL_MS);
};

module.exports = startEmailSync;
