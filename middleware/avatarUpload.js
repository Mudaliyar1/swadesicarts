const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (required for Magic Number validation and Cloudinary upload)
const storage = multer.memoryStorage();

// File filter based on extension and mime type
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  // Strictly check extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  // strictly check mime type string
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE_TYPE', 'Only valid image files are allowed for avatars.'));
  }
};

const avatarUpload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB absolute limit for user profiles
  },
  fileFilter: fileFilter
});

/**
 * Middleware to strictly validate Magic Numbers (File Signatures) 
 * to guarantee the file is an actual image, not a malicious script renamed to .jpg.
 */
const validateMagicNumbers = (req, res, next) => {
  if (!req.file) return next(); // If no file, just continue (maybe user is saving other profile info)

  const buffer = req.file.buffer;
  
  // We need at least 4 bytes to check magic numbers
  if (buffer.length < 4) {
    return res.status(400).json({ success: false, message: 'Invalid file data.' });
  }

  // Read first 4 bytes as hex
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  
  let isValid = false;
  
  // JPEG magic numbers: FFD8FF...
  if (hex.startsWith('FFD8FF')) isValid = true;
  // PNG magic number: 89504E47
  else if (hex === '89504E47') isValid = true;
  // GIF magic numbers: 47494638 (GIF8)
  else if (hex === '47494638') isValid = true;
  // WebP magic number: 52494646 (RIFF), plus 'WEBP' at bytes 8-11
  else if (hex === '52494646') {
    if (buffer.length >= 12) {
      const webpMatch = buffer.toString('ascii', 8, 12);
      if (webpMatch === 'WEBP') isValid = true;
    }
  }

  if (!isValid) {
    return res.status(400).json({ 
      success: false, 
      message: 'Malicious file detected. File signature does not match a valid image format.' 
    });
  }

  next();
};

module.exports = {
  avatarUpload,
  validateMagicNumbers
};
