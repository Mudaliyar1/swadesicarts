const cloudinary = require('../config/cloudinary');

const inferFileType = (resourceType, format) => {
  const normalizedFormat = (format || '').toLowerCase();
  if (resourceType === 'video') return 'video';
  if (normalizedFormat === 'pdf') return 'pdf';
  if (resourceType === 'image') return 'image';
  if (resourceType === 'raw') return normalizedFormat ? 'document' : 'raw';
  return 'unknown';
};

const getCloudinaryUsage = async () => {
  try {
    return await cloudinary.api.usage();
  } catch (error) {
    console.error('Cloudinary usage API error:', error.message);
    return null;
  }
};

const fetchResourcesByType = async (resourceType) => {
  const assets = [];
  let nextCursor;

  do {
    const response = await cloudinary.api.resources({
      type: 'upload',
      resource_type: resourceType,
      max_results: 500,
      next_cursor: nextCursor
    });

    const resources = Array.isArray(response.resources) ? response.resources : [];
    assets.push(
      ...resources.map((item) => ({
        publicId: item.public_id,
        secureUrl: item.secure_url,
        format: item.format || '',
        resourceType: item.resource_type || resourceType,
        fileType: inferFileType(item.resource_type || resourceType, item.format),
        bytes: item.bytes || 0,
        width: item.width || 0,
        height: item.height || 0,
        duration: item.duration || 0,
        createdAt: item.created_at ? new Date(item.created_at) : new Date()
      }))
    );

    nextCursor = response.next_cursor;
  } while (nextCursor);

  return assets;
};

const getAllCloudinaryAssets = async () => {
  try {
    const [images, videos, raw] = await Promise.all([
      fetchResourcesByType('image'),
      fetchResourcesByType('video'),
      fetchResourcesByType('raw')
    ]);

    const merged = [...images, ...videos, ...raw];
    const byId = new Map();

    for (const asset of merged) {
      byId.set(asset.publicId, asset);
    }

    return Array.from(byId.values());
  } catch (error) {
    console.error('Cloudinary list API error:', error.message);
    return [];
  }
};

const deleteCloudinaryAsset = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: 'upload',
      invalidate: true
    });
    return result;
  } catch (error) {
    console.error(`Cloudinary delete error for ${publicId}:`, error.message);
    throw error;
  }
};

module.exports = {
  inferFileType,
  getCloudinaryUsage,
  getAllCloudinaryAssets,
  deleteCloudinaryAsset
};
