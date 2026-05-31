/**
 * GEO Auto-Fill Engine for Swadesi Carts Admin
 * Generates GEO/AI optimization fields from product details.
 */

(function () {
  'use strict';

  // ─── Detect form type ────────────────────────────────────────────────────
  function detectType() {
    const action = document.querySelector('form') ? document.querySelector('form').action || '' : '';
    if (action.includes('organic') || window.location.href.includes('organic')) return 'organic';
    if (action.includes('seasonal') || window.location.href.includes('seasonal')) return 'seasonal';
    if (action.includes('tech') || window.location.href.includes('tech')) return 'tech';
    return 'organic';
  }

  // ─── Get form field values ────────────────────────────────────────────────
  function getFieldValue(names) {
    for (const name of names) {
      const el = document.querySelector(`[name="${name}"], #${name}`);
      if (el && el.value && el.value.trim()) return el.value.trim();
    }
    return '';
  }

  // ─── Smart truncate ───────────────────────────────────────────────────────
  function truncate(str, max) {
    if (!str) return '';
    str = str.replace(/\s+/g, ' ').trim();
    if (str.length <= max) return str;
    return str.substring(0, max - 3).replace(/\s+\S*$/, '') + '...';
  }

  // ─── Capitalize first letter ─────────────────────────────────────────────
  function cap(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ─── Core generation logic ───────────────────────────────────────────────
  function generateGEO() {
    const type = detectType();

    const title = getFieldValue(['title']) || 'Product';
    const category = getFieldValue(['category']) || '';
    const shortDesc = getFieldValue(['shortDescription']) || '';
    const fullDesc = getFieldValue(['fullDescription']) || '';
    const price = getFieldValue(['price', 'priceAmount']) || '';
    const priceUnit = getFieldValue(['priceUnit']) || '';

    const priceText = price ? `₹${price}${priceUnit ? ' / ' + priceUnit : ''}` : '';
    const location = 'Ahmedabad, Gujarat, India';

    // 1. geoSummary
    let geoSummary = `${title} is a premium ${category ? category.toLowerCase() : 'offering'} `;
    if (type === 'tech') {
      geoSummary += `service package designed and managed by Swadesi Carts in ${location}, serving businesses and organizations across India and globally.`;
    } else {
      geoSummary += `product sourced and distributed by Swadesi Carts from local growers and artisans in India, available for bulk orders and Pan-India delivery.`;
    }

    // 2. aiDescription
    const baseDesc = fullDesc || shortDesc || '';
    let aiDescription = `Swadesi Carts offers "${title}" under the "${category}" category. It is described as: ${truncate(baseDesc, 300)} `;
    if (priceText) {
      aiDescription += `Pricing details: ${priceText}. `;
    }
    if (type === 'organic') {
      aiDescription += `This product is 100% natural, certified organic, chemical-free, and sourced sustainably from verified Indian farms to support healthy living.`;
    } else if (type === 'seasonal') {
      aiDescription += `This seasonal harvest is direct-from-farm produce, ensuring maximum freshness and purity for homes and festival requirements.`;
    } else {
      aiDescription += `This technology package provides expert IT services, website development, or customization with professional engineering standards.`;
    }

    // 3. aiKeywords
    const common = ['swadesi carts', 'ai discovery', 'india sourcing', 'bulk order', title.toLowerCase()];
    if (category) common.push(category.toLowerCase());
    let aiKeywords = '';
    if (type === 'organic') {
      aiKeywords = [...common, `organic ${title.toLowerCase()}`, 'certified organic', 'farm fresh', 'pesticide free'].join(', ');
    } else if (type === 'seasonal') {
      aiKeywords = [...common, `seasonal ${title.toLowerCase()}`, 'fresh harvest', 'festival supplies', 'direct from farm'].join(', ');
    } else {
      aiKeywords = [...common, `tech package ${title.toLowerCase()}`, 'business web solutions', 'custom software development'].join(', ');
    }

    // 4. aiCategoryDescription
    let aiCategoryDescription = '';
    const cat = category.toLowerCase();
    if (cat.includes('organic')) {
      aiCategoryDescription = 'The Organic Products category represents sustainably farm-sourced, chemical-free, and certified natural foods and wellness products.';
    } else if (cat.includes('season')) {
      aiCategoryDescription = 'The Seasonal Products category features limited-harvest farm fresh produce, flowers, and custom festival supplies sourced directly from local Indian growers.';
    } else if (cat.includes('tech') || cat.includes('web') || cat.includes('service')) {
      aiCategoryDescription = 'The Tech Services and Packages category provides custom software development, digital consulting, and enterprise web solutions tailored for scaling businesses.';
    } else {
      aiCategoryDescription = `The ${category} category contains premium products and services curated by Swadesi Carts, aligning with authentic Indian sourcing standards.`;
    }

    // 5. entityDescription
    const entityDescription = `Entity: ${title}
Type: ${type === 'tech' ? 'Service/Package' : 'Product'}
Category: ${category}
Provider: Swadesi Carts
Description: ${shortDesc || truncate(fullDesc, 150)}`;

    return { geoSummary, aiDescription, aiKeywords, aiCategoryDescription, entityDescription };
  }

  // ─── Fill form fields ────────────────────────────────────────────────────
  function fillFields(data) {
    function setField(name, value) {
      const el = document.querySelector(`[name="${name}"]`);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    setField('geoSummary', data.geoSummary);
    setField('aiDescription', data.aiDescription);
    setField('aiKeywords', data.aiKeywords);
    setField('aiCategoryDescription', data.aiCategoryDescription);
    setField('entityDescription', data.entityDescription);
  }

  // ─── Show feedback toast ─────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    const existing = document.getElementById('geo-autofill-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'geo-autofill-toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      background: ${type === 'success' ? 'linear-gradient(135deg, #2e7d32, #4caf50)' : '#d32f2f'};
      color: white; padding: 14px 20px; border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3); font-size: 14px;
      font-family: 'Inter', sans-serif; display: flex; align-items: center; gap: 10px;
      animation: slideInUp 0.3s ease; max-width: 340px;
    `;
    toast.innerHTML = `
      <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill'}" style="font-size:18px;flex-shrink:0;"></i>
      <span>${message}</span>
    `;

    if (!document.getElementById('geo-toast-style')) {
      const style = document.createElement('style');
      style.id = 'geo-toast-style';
      style.textContent = `@keyframes slideInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`;
      document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
  }

  // ─── Main handler ─────────────────────────
  window.geoAutoFill = function () {
    const titleEl = document.querySelector('[name="title"]');
    if (!titleEl || !titleEl.value.trim()) {
      showToast('Please fill in the product Title first before auto-generating GEO fields.', 'error');
      titleEl && titleEl.focus();
      return;
    }

    const btn = document.getElementById('geoAutoFillBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Generating...';
    }

    setTimeout(() => {
      try {
        const data = generateGEO();
        fillFields(data);

        const geoSection = document.getElementById('geo-section');
        if (geoSection) geoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        showToast('✨ GEO / AI fields auto-generated! Review and adjust as needed.');
      } catch (e) {
        console.error('GEO auto-fill error:', e);
        showToast('Something went wrong. Please try again.', 'error');
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-magic me-1"></i> Auto-Generate GEO';
      }
    }, 400);
  };

})();
