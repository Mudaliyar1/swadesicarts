const multer = require('multer');
const path = require('path');

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|webm|pdf)$/i;
const ALLOWED_MIMETYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
  'application/pdf'
];

const BLOCKED_EXTENSIONS = /\.(js|ts|jsx|tsx|py|rb|php|sh|bash|exe|bat|cmd|dll|so|app|dmg|msi|vbs|ps1|pl|java|c|cpp|h|go|rs|zip|tar|gz|rar|7z|sql|db|csv|xml|json|yaml|yml|env|config)$/i;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // First, block any code / risky extension regardless of mime type
  if (BLOCKED_EXTENSIONS.test(ext)) {
    return cb(new Error(`File type "${ext}" is not allowed. Only images, videos, and PDFs are permitted.`));
  }

  const validExt  = ALLOWED_EXTENSIONS.test(ext);
  const validMime = ALLOWED_MIMETYPES.includes(file.mimetype);

  if (validExt && validMime) {
    return cb(null, true);
  }

  cb(new Error(`Invalid file type. Only images (JPG, PNG, GIF, WebP), videos (MP4, MOV, AVI, MKV, WebM), and PDFs are allowed.`));
};

const ticketAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 5                     // max 5 files at once
  },
  fileFilter
});

/**
 * Deep magic-number validation for ticket attachments.
 * Checks actual file bytes, not just the extension or MIME type.
 */
const validateAttachmentMagicNumbers = (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  for (const file of req.files) {
    const buf = file.buffer;
    if (!buf || buf.length < 4) {
      return res.status(400).json({ success: false, message: `File "${file.originalname}" is empty or too small.` });
    }

    const hex4 = buf.toString('hex', 0, 4).toUpperCase();
    const hex8 = buf.length >= 8 ? buf.toString('hex', 0, 8).toUpperCase() : hex4;
    let valid = false;

    // JPEG: FFD8FF
    if (hex4.startsWith('FFD8FF')) valid = true;
    // PNG: 89504E47
    else if (hex4 === '89504E47') valid = true;
    // GIF: 47494638
    else if (hex4.startsWith('47494638')) valid = true;
    // WebP: RIFF....WEBP
    else if (hex4 === '52494646' && buf.length >= 12 && buf.toString('ascii', 8, 12) === 'WEBP') valid = true;
    // PDF: %PDF-
    else if (buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-') valid = true;
    // MP4/MOV: ftyp box at byte 4  (hex: 66747970)
    else if (buf.length >= 8 && buf.toString('hex', 4, 8).toUpperCase() === '66747970') valid = true;
    // AVI: RIFF....AVI (52494646 ... 41564920)
    else if (hex4 === '52494646' && buf.length >= 12 && buf.toString('ascii', 8, 12) === 'AVI ') valid = true;
    // MKV/WebM: EBML header (1A45DFA3)
    else if (hex4 === '1A45DFA3') valid = true;

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: `File "${file.originalname}" failed security validation. The file's actual content does not match its declared type.`
      });
    }
  }

  next();
};

module.exports = { ticketAttachmentUpload, validateAttachmentMagicNumbers };
