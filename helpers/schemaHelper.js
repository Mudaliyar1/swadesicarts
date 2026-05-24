function escapeJsonLd(value) {
  return String(value || '')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function toJsonLd(data) {
  return escapeJsonLd(JSON.stringify(data, null, 2));
}

function organizationSchema({ name, url, description, logo, sameAs = [], contactPoint = [] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    description
  };

  if (logo) schema.logo = logo;
  if (Array.isArray(sameAs) && sameAs.length > 0) schema.sameAs = sameAs.filter(Boolean);
  if (Array.isArray(contactPoint) && contactPoint.length > 0) schema.contactPoint = contactPoint;

  return schema;
}

function productSchema({ name, description, url, image, brand = 'Swadesi Carts', sku, offers, category }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    brand: { '@type': 'Brand', name: brand }
  };

  if (image) schema.image = image;
  if (sku) schema.sku = sku;
  if (category) schema.category = category;
  if (offers) schema.offers = offers;

  return schema;
}

function serviceSchema({ name, description, url, provider = 'Swadesi Carts', areaServed }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    provider: { '@type': 'Organization', name: provider }
  };

  if (areaServed) schema.areaServed = areaServed;
  return schema;
}

function faqSchema(questions = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions
      .filter(item => item && item.question && item.answer)
      .map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
  };
}

function breadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
      .filter(item => item && item.name && item.url)
      .map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
  };
}

function contactSchema({ name, url, telephone, email, address, sameAs = [] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPoint',
    contactType: 'customer service',
    name,
    url
  };

  if (telephone) schema.telephone = telephone;
  if (email) schema.email = email;
  if (address) schema.address = address;
  if (Array.isArray(sameAs) && sameAs.length > 0) schema.sameAs = sameAs.filter(Boolean);

  return schema;
}

module.exports = {
  toJsonLd,
  organizationSchema,
  productSchema,
  serviceSchema,
  faqSchema,
  breadcrumbSchema,
  contactSchema
};