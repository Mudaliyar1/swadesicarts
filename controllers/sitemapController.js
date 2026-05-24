const OrganicProduct = require('../models/OrganicProduct');
const SeasonalProduct = require('../models/SeasonalProduct');
const TechPackage = require('../models/TechPackage');
const { getSiteUrl } = require('../helpers/siteUrl');

// Helper: format date for sitemap
function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

// Helper: escape XML special characters
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// GET /sitemap.xml
exports.getSitemap = async (req, res) => {
  try {
    const siteUrl = getSiteUrl(res.locals.siteSettings);
    const today = new Date().toISOString().split('T')[0];

    // Fetch all visible products
    const [organicProducts, seasonalProducts, techPackages] = await Promise.all([
      OrganicProduct.find({ isVisible: true }).select('slug _id updatedAt title').lean(),
      SeasonalProduct.find({ isVisible: true }).select('slug _id updatedAt title').lean(),
      TechPackage.find({ isVisible: true }).select('slug _id updatedAt title').lean()
    ]);

    // Static pages
    const staticPages = [
      { url: '/', changefreq: 'weekly', priority: '1.0', lastmod: today },
      { url: '/about', changefreq: 'monthly', priority: '0.7', lastmod: today },
      { url: '/contact', changefreq: 'monthly', priority: '0.6', lastmod: today },
      { url: '/organic-products', changefreq: 'weekly', priority: '0.9', lastmod: today },
      { url: '/seasonal-products', changefreq: 'weekly', priority: '0.9', lastmod: today },
      { url: '/tech-packages', changefreq: 'weekly', priority: '0.8', lastmod: today }
    ];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Organic product pages
    for (const p of organicProducts) {
      const slug = p.slug || p._id.toString();
      xml += `  <url>
    <loc>${siteUrl}/organic-products/${escapeXml(slug)}</loc>
    <lastmod>${formatDate(p.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Seasonal product pages
    for (const p of seasonalProducts) {
      const slug = p.slug || p._id.toString();
      xml += `  <url>
    <loc>${siteUrl}/seasonal-products/${escapeXml(slug)}</loc>
    <lastmod>${formatDate(p.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Tech package pages
    for (const p of techPackages) {
      const slug = p.slug || p._id.toString();
      xml += `  <url>
    <loc>${siteUrl}/tech-packages/${escapeXml(slug)}</loc>
    <lastmod>${formatDate(p.updatedAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
    res.send(xml);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
};
