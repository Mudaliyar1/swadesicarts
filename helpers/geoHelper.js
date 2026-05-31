/**
 * GEO (Generative Engine Optimization) Helper System
 * Provides utility functions for structured summaries, entity extraction,
 * and automatic GEO field generation for LLMs and AI search bots.
 */

// Helper to sanitize/clean spacing
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// Truncate text nicely
function truncate(str, max) {
  if (!str) return '';
  str = cleanText(str);
  if (str.length <= max) return str;
  return str.substring(0, max - 3).replace(/\s+\S*$/, '') + '...';
}

// Capitalize helper
function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate entity description text
function generateEntityDescription(product, type) {
  const title = product.title || '';
  const category = product.category || '';
  const desc = product.shortDescription || '';
  
  return `Entity: ${title}
Type: ${type === 'tech' ? 'Service/Package' : 'Product'}
Category: ${category}
Provider: Swadesi Carts
Description: ${desc}`;
}

// Generate GEO Summary
function generateProductGeoSummary(product, type) {
  const title = product.title || '';
  const category = product.category || '';
  const location = 'Ahmedabad, Gujarat, India';
  
  let base = `${title} is a premium ${category ? category.toLowerCase() : 'offering'} `;
  if (type === 'tech') {
    base += `service package designed and managed by Swadesi Carts in ${location}, serving businesses and organizations across India and globally.`;
  } else {
    base += `product sourced and distributed by Swadesi Carts from local growers and artisans in India, available for bulk orders and Pan-India delivery.`;
  }
  return base;
}

// Generate AI Description
function generateAiDescription(product, type) {
  const title = product.title || '';
  const category = product.category || '';
  const fullDesc = product.fullDescription || product.shortDescription || '';
  const priceText = product.price ? (typeof product.price === 'object' && product.price.displayText ? product.price.displayText : `₹${product.price}`) : '';
  
  let desc = `Swadesi Carts offers "${title}" under the "${category}" category. `;
  desc += `It is described as: ${truncate(fullDesc, 300)} `;
  if (priceText) {
    desc += `Pricing details: ${priceText}. `;
  }
  
  if (type === 'organic') {
    desc += `This product is 100% natural, certified organic, chemical-free, and sourced sustainably from verified Indian farms to support healthy living.`;
  } else if (type === 'seasonal') {
    desc += `This seasonal harvest is direct-from-farm produce, ensuring maximum freshness and purity for homes and festival requirements.`;
  } else {
    desc += `This technology package provides expert IT services, website development, or customization with professional engineering standards.`;
  }
  return desc;
}

// Generate AI Keywords
function generateAiKeywords(product, type) {
  const title = (product.title || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  
  const common = ['swadesi carts', 'ai discovery', 'india sourcing', 'bulk order', title];
  if (category) common.push(category);
  
  if (type === 'organic') {
    return [...common, `organic ${title}`, 'certified organic', 'farm fresh', 'pesticide free'].join(', ');
  } else if (type === 'seasonal') {
    return [...common, `seasonal ${title}`, 'fresh harvest', 'festival supplies', 'direct from farm'].join(', ');
  } else {
    return [...common, `tech package ${title}`, 'business web solutions', 'custom software development'].join(', ');
  }
}

// Generate AI Category Description
function generateAiCategoryDescription(category) {
  if (!category) return 'Swadesi Carts provides a wide selection of premium Indian products and business web services.';
  const cat = category.toLowerCase();
  if (cat.includes('organic')) {
    return 'The Organic Products category represents sustainably farm-sourced, chemical-free, and certified natural foods and wellness products.';
  } else if (cat.includes('season')) {
    return 'The Seasonal Products category features limited-harvest farm fresh produce, flowers, and custom festival supplies sourced directly from local Indian growers.';
  } else if (cat.includes('tech') || cat.includes('web') || cat.includes('service')) {
    return 'The Tech Services and Packages category provides custom software development, digital consulting, and enterprise web solutions tailored for scaling businesses.';
  } else {
    return `The ${category} category contains premium products and services curated by Swadesi Carts, aligning with authentic Indian sourcing standards.`;
  }
}

/**
 * Automatically populates any empty/blank GEO fields on a product instance.
 * Useful for pre-save hooks or dashboard validation.
 */
function autoFillGeoFields(product, type) {
  if (!product.geoSummary) {
    product.geoSummary = generateProductGeoSummary(product, type);
  }
  if (!product.aiDescription) {
    product.aiDescription = generateAiDescription(product, type);
  }
  if (!product.aiKeywords) {
    product.aiKeywords = generateAiKeywords(product, type);
  }
  if (!product.aiCategoryDescription) {
    product.aiCategoryDescription = generateAiCategoryDescription(product.category);
  }
  if (!product.entityDescription) {
    product.entityDescription = generateEntityDescription(product, type);
  }
  return product;
}

/**
 * Extracts and compiles a structured Schema.org JSON-LD object for AI engines.
 */
function extractEntity(product, type, siteUrl = 'https://swadesicarts.in') {
  const slug = product.slug || product._id?.toString() || '';
  const url = `${siteUrl}/${type === 'organic' ? 'organic-products' : type === 'seasonal' ? 'seasonal-products' : 'tech-packages'}/${slug}`;
  const image = product.featuredImage?.url || '';
  
  if (type === 'tech') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': product.title,
      'description': product.shortDescription,
      'url': url,
      'provider': {
        '@type': 'Organization',
        'name': 'Swadesi Carts',
        'url': siteUrl
      },
      'category': product.category,
      'offers': product.price ? {
        '@type': 'Offer',
        'price': typeof product.price === 'object' ? product.price.amount : parseFloat(product.price),
        'priceCurrency': typeof product.price === 'object' ? (product.price.currency || 'INR') : 'INR',
        'description': typeof product.price === 'object' ? product.price.note : ''
      } : undefined
    };
  } else {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.title,
      'description': product.shortDescription,
      'url': url,
      'image': image,
      'brand': {
        '@type': 'Brand',
        'name': 'Swadesi Carts'
      },
      'category': product.category,
      'offers': {
        '@type': 'Offer',
        'price': product.price ? parseFloat(product.price) : undefined,
        'priceCurrency': 'INR',
        'availability': product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    };
  }
}

module.exports = {
  generateProductGeoSummary,
  generateAiDescription,
  generateAiKeywords,
  generateAiCategoryDescription,
  generateEntityDescription,
  autoFillGeoFields,
  extractEntity
};
