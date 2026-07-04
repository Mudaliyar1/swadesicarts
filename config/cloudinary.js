const cloudinary = require('cloudinary').v2;
const Media = require('../models/mediaModel');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Proxy/wrap upload_stream to auto-register uploaded files to Media model collection in MongoDB!
const originalUploadStream = cloudinary.uploader.upload_stream;
cloudinary.uploader.upload_stream = function(options, callback) {
  const wrappedCallback = (error, result) => {
    if (!error && result) {
      setImmediate(async () => {
        try {
          const exists = await Media.findOne({ publicId: result.public_id });
          if (!exists) {
            let fileType = 'image';
            if (result.resource_type === 'video') fileType = 'video';
            else if (result.format === 'pdf') fileType = 'pdf';
            else if (result.resource_type === 'raw') fileType = 'document';

            await Media.create({
              publicId: result.public_id,
              secureUrl: result.secure_url,
              resourceType: result.resource_type,
              fileType: fileType,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              duration: result.duration || null,
              format: result.format,
              uploadedAt: result.created_at || new Date(),
              isUsed: false,
              usageLocations: []
            });
            console.log(`[Cloudinary Hook] Auto-registered new stream upload in Media DB: ${result.public_id}`);
          }
        } catch (err) {
          console.error('[Cloudinary Hook] Failed to auto-register stream media in DB:', err);
        }
      });
    }
    if (callback) callback(error, result);
  };

  return originalUploadStream.call(cloudinary.uploader, options, wrappedCallback);
};

// Proxy/wrap upload (direct upload) to auto-register uploaded files to Media model collection in MongoDB!
const originalUpload = cloudinary.uploader.upload;
cloudinary.uploader.upload = function(file, options, callback) {
  let actualCallback = callback;
  let actualOptions = options;
  if (typeof options === 'function') {
    actualCallback = options;
    actualOptions = {};
  }

  const registerInDb = async (result) => {
    try {
      const exists = await Media.findOne({ publicId: result.public_id });
      if (!exists) {
        let fileType = 'image';
        if (result.resource_type === 'video') fileType = 'video';
        else if (result.format === 'pdf') fileType = 'pdf';
        else if (result.resource_type === 'raw') fileType = 'document';

        await Media.create({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          resourceType: result.resource_type,
          fileType: fileType,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration || null,
          format: result.format,
          uploadedAt: result.created_at || new Date(),
          isUsed: false,
          usageLocations: []
        });
        console.log(`[Cloudinary Hook] Auto-registered new direct upload in Media DB: ${result.public_id}`);
      }
    } catch (err) {
      console.error('[Cloudinary Hook] Failed to auto-register direct media in DB:', err);
    }
  };

  const wrappedCallback = (error, result) => {
    if (!error && result) {
      setImmediate(() => registerInDb(result));
    }
    if (actualCallback) actualCallback(error, result);
  };

  if (callback || typeof options === 'function') {
    return originalUpload.call(cloudinary.uploader, file, actualOptions, wrappedCallback);
  } else {
    return originalUpload.call(cloudinary.uploader, file, actualOptions).then(result => {
      setImmediate(() => registerInDb(result));
      return result;
    });
  }
};

module.exports = cloudinary;
