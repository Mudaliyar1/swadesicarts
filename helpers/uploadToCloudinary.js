const cloudinary = require('../config/cloudinary');
const Media = require('../models/mediaModel');
const { inferFileType } = require('./cloudinaryHelper');
const { Readable } = require('stream');

/**
 * Upload a Buffer to Cloudinary and return the result.
 * Determines resource_type automatically from mimeType.
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const resourceType =
      options.resource_type ||
      (options.mimeType && options.mimeType.startsWith('video/') ? 'video' :
       options.mimeType === 'application/pdf' ? 'raw' : 'image');

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: options.folder || 'ticket-attachments',
        ...options
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Upload a ticket message attachment to Cloudinary and persist it in the Media collection.
 *
 * @param {Object} file  - Multer file object (has buffer, originalname, mimetype, size)
 * @param {Object} meta  - { ticketNumber, uploadedByModel, uploadedById }
 * @returns {Object} attachment suitable for pushing into ticket.messages[n].attachments
 */
const uploadTicketAttachment = async (file, meta = {}) => {
  const mimeType = file.mimetype;
  const resourceType =
    mimeType.startsWith('video/') ? 'video' :
    mimeType === 'application/pdf' ? 'raw' : 'image';

  const result = await uploadBufferToCloudinary(file.buffer, {
    resource_type: resourceType,
    mimeType,
    folder: `ticket-attachments/${meta.ticketNumber || 'misc'}`,
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
      relatedId:       meta.ticketNumber || '',
      usageSection:    'Ticket Attachment',
      usageLocations:  [{ relatedModel: 'Ticket', relatedId: meta.ticketNumber || '', relatedTitle: `Ticket ${meta.ticketNumber || ''}`, usageSection: 'Ticket Attachment' }],
      isUsed:          true,
      lastSyncedAt:    new Date(),
      uploadedByModel: meta.uploadedByModel || 'System',
      uploadedById:    meta.uploadedById    || ''
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    publicId: result.public_id,
    url:      result.secure_url,
    fileType,
    filename: file.originalname,
    bytes:    result.bytes || 0
  };
};

module.exports = { uploadBufferToCloudinary, uploadTicketAttachment };
