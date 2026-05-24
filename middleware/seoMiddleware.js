const { organizationSchema, toJsonLd } = require('../helpers/schemaHelper');
const { getSiteUrl } = require('../helpers/siteUrl');

function cleanPath(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  return pathname.split('?')[0].replace(/\/+$/, '') || '/';
}

function humanizePath(pathname) {
  const clean = cleanPath(pathname);
  if (clean === '/') return 'Swadesi Carts - Organic, Seasonal & Tech Products';

  const parts = clean.split('/').filter(Boolean);
  const label = parts[parts.length - 1]
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
  return `${label} - Swadesi Carts`;
}

function buildSeoDefaults(req, siteSettings) {
  const baseUrl = getSiteUrl(siteSettings);
  const canonical = `${baseUrl}${cleanPath(req.originalUrl || req.url || '/')}`;
  const path = cleanPath(req.path || '/');
  const siteName = 'Swadesi Carts';
  const primary = siteSettings?.colors?.primary || '#4C1E4F';
  const accent = siteSettings?.colors?.accent || '#B5A886';
  const heading = siteSettings?.colors?.headingText || '#2c3e50';
  const body = siteSettings?.colors?.bodyText || '#495057';

  const defaults = {
    title: humanizePath(path),
    description: 'Premium organic products, fresh seasonal produce, and professional tech packages from Swadesi Carts.',
    keywords: 'Swadesi Carts, organic products, seasonal products, tech packages, India',
    canonical,
    ogType: path === '/' ? 'website' : 'article',
    ogSiteName: siteName,
    ogImage: '',
    twitterCard: 'summary_large_image',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    geoKeywords: '',
    aiSearchPhrases: '',
    theme: {
      primary,
      accent,
      heading,
      body
    }
  };

  return defaults;
}

function seoMiddleware(req, res, next) {
  const siteSettings = res.locals.siteSettings || null;
  const defaults = buildSeoDefaults(req, siteSettings);
  const existingSeo = res.locals.seo || {};

  res.locals.seo = {
    ...defaults,
    ...existingSeo,
    theme: {
      ...defaults.theme,
      ...(existingSeo.theme || {})
    }
  };

  if (!res.locals.schemaJsonLd) {
    const baseUrl = getSiteUrl(siteSettings);
    const orgSchema = organizationSchema({
      name: 'Swadesi Carts',
      url: baseUrl,
      description: 'Premium organic products, fresh seasonal produce, and professional tech packages delivered across India.'
    });
    res.locals.schemaJsonLd = [toJsonLd(orgSchema)];
  }

  next();
}

module.exports = seoMiddleware;