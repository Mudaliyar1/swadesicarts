function normalizeSiteUrl(value) {
  const fallback = process.env.SITE_URL || 'https://swadesicarts.in';
  const raw = typeof value === 'string' ? value.trim() : '';
  const candidate = raw || fallback;

  if (!candidate) return fallback;

  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  return withProtocol.replace(/\/+$/, '');
}

function getSiteUrl(siteSettings) {
  return normalizeSiteUrl(siteSettings && siteSettings.siteUrl);
}

module.exports = {
  normalizeSiteUrl,
  getSiteUrl
};