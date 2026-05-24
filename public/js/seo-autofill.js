/**
 * SEO Auto-Fill Engine for Swadesi Carts Admin
 * Generates SEO/GEO fields from product details without any external API.
 * Just smart template logic based on product title, description, category, and price.
 */

(function () {
  'use strict';

  // ─── Keyword banks by product type ───────────────────────────────────────
  const GEO_CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
  const ORGANIC_INTENT = ['buy organic', 'fresh organic', 'certified organic', 'natural', 'chemical-free', 'farm fresh', 'pesticide free'];
  const SEASONAL_INTENT = ['fresh seasonal', 'buy seasonal', 'farm fresh', 'seasonal harvest', 'locally sourced', 'direct from farm'];
  const TECH_INTENT = ['affordable', 'professional', 'best', 'reliable', 'expert', 'quality', 'trusted'];
  const CONVERSATIONAL_STARTERS = ['where to buy', 'best place to buy', 'how to get', 'which is the best', 'find online'];

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

  // ─── Random pick ─────────────────────────────────────────────────────────
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ─── Clean slug from title ───────────────────────────────────────────────
  function toSlug(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ─── Core generation logic ───────────────────────────────────────────────
  function generateSEO() {
    const type = detectType();

    const title = getFieldValue(['title']) || 'Product';
    const category = getFieldValue(['category']) || '';
    const shortDesc = getFieldValue(['shortDescription']) || '';
    const fullDesc = getFieldValue(['fullDescription']) || '';
    const price = getFieldValue(['price', 'priceAmount']) || '';
    const priceUnit = getFieldValue(['priceUnit']) || '';

    // Use short description if available, otherwise take first 150 chars of full desc
    const descBase = shortDesc || truncate(fullDesc, 150);
    const priceStr = price ? `₹${price}${priceUnit ? '/' + priceUnit : ''}` : '';
    const cityPick = pick(GEO_CITIES);

    let seoTitle = '';
    let seoMetaDesc = '';
    let seoKeywords = '';
    let geoKeywords = '';
    let longTailKeywords = '';
    let aiPhrases = '';
    let slug = '';

    if (type === 'organic') {
      seoTitle = truncate(`Buy ${cap(title)} Online – Certified Organic | Swadesi Carts`, 70);
      seoMetaDesc = truncate(
        descBase
          ? `${cap(descBase)} Order fresh, certified organic ${title.toLowerCase()} online. ${priceStr ? 'Starting at ' + priceStr + '.' : ''} Delivered across India.`
          : `Buy premium certified organic ${title.toLowerCase()} online. Natural, chemical-free, farm-fresh. ${priceStr ? 'Starts at ' + priceStr + '.' : ''} Delivered across India.`,
        160
      );
      seoKeywords = `${title.toLowerCase()}, organic ${title.toLowerCase()}, buy organic ${title.toLowerCase()}, certified organic ${title.toLowerCase()} India, ${category ? 'organic ' + category.toLowerCase() + ', ' : ''}natural ${title.toLowerCase()} online, farm fresh ${title.toLowerCase()}`;
      geoKeywords = `organic ${title.toLowerCase()} ${cityPick}, buy ${title.toLowerCase()} online India, farm fresh ${title.toLowerCase()} India, authentic organic ${title.toLowerCase()} ${pick(GEO_CITIES)}`;
      longTailKeywords = `where to buy organic ${title.toLowerCase()} near me, best certified organic ${title.toLowerCase()} in India, ${pick(CONVERSATIONAL_STARTERS)} ${title.toLowerCase()} online, chemical free ${title.toLowerCase()} home delivery`;
      aiPhrases = `best organic ${title.toLowerCase()} to buy in India, is ${title.toLowerCase()} organic, natural ${title.toLowerCase()} for cooking${priceStr ? ', affordable organic ' + title.toLowerCase() + ' ' + priceStr : ''}, trusted organic brand India`;
      slug = toSlug(title);

    } else if (type === 'seasonal') {
      seoTitle = truncate(`Buy Fresh ${cap(title)} Online – Seasonal Produce | Swadesi Carts`, 70);
      seoMetaDesc = truncate(
        descBase
          ? `${cap(descBase)} Fresh seasonal ${title.toLowerCase()} sourced directly from farms. ${priceStr ? 'From ' + priceStr + '.' : ''} Home delivery across India.`
          : `Order fresh seasonal ${title.toLowerCase()} online. Farm-sourced, naturally grown. ${priceStr ? 'From ' + priceStr + '.' : ''} Home delivery across India.`,
        160
      );
      seoKeywords = `fresh ${title.toLowerCase()}, seasonal ${title.toLowerCase()}, buy ${title.toLowerCase()} online, ${title.toLowerCase()} farm fresh, ${category ? category.toLowerCase() + ' online, ' : ''}seasonal produce India`;
      geoKeywords = `fresh ${title.toLowerCase()} ${cityPick}, seasonal ${title.toLowerCase()} India, buy farm fresh ${title.toLowerCase()} ${pick(GEO_CITIES)}, ${title.toLowerCase()} delivery India`;
      longTailKeywords = `where to buy fresh ${title.toLowerCase()} near me, seasonal ${title.toLowerCase()} home delivery India, best fresh ${title.toLowerCase()} online, ${pick(CONVERSATIONAL_STARTERS)} fresh ${title.toLowerCase()} India`;
      aiPhrases = `freshest ${title.toLowerCase()} available online India, when is ${title.toLowerCase()} season in India, buy seasonal ${title.toLowerCase()} direct from farm, ${title.toLowerCase()} delivery same day${priceStr ? ', ' + title.toLowerCase() + ' price ' + priceStr : ''}`;
      slug = toSlug(title);

    } else {
      // tech
      const priceDisplay = price ? `₹${parseFloat(price).toLocaleString('en-IN')}` : '';
      seoTitle = truncate(`${cap(title)} – Affordable Tech Package | Swadesi Carts`, 70);
      seoMetaDesc = truncate(
        descBase
          ? `${cap(descBase)} Get ${title.toLowerCase()} at the best price. ${priceDisplay ? 'Starting at ' + priceDisplay + '.' : ''} Professional tech services for businesses across India.`
          : `Professional ${title.toLowerCase()} package for businesses. ${priceDisplay ? 'From ' + priceDisplay + '.' : ''} Reliable, affordable tech services across India.`,
        160
      );
      seoKeywords = `${title.toLowerCase()}, ${category ? category.toLowerCase() + ', ' : ''}affordable ${title.toLowerCase()} India, professional ${title.toLowerCase()} services, ${title.toLowerCase()} for small business, tech packages India`;
      geoKeywords = `${title.toLowerCase()} ${cityPick}, ${category ? category.toLowerCase() + ' services ' + cityPick + ', ' : ''}IT services India, tech solutions ${pick(GEO_CITIES)}, best ${title.toLowerCase()} company India`;
      longTailKeywords = `affordable ${title.toLowerCase()} for small business India, best ${title.toLowerCase()} service provider India, ${pick(CONVERSATIONAL_STARTERS)} ${title.toLowerCase()} India, professional ${title.toLowerCase()} near me`;
      aiPhrases = `best ${title.toLowerCase()} company in India, ${title.toLowerCase()} price comparison India${priceDisplay ? ', ' + title.toLowerCase() + ' starting at ' + priceDisplay : ''}, trusted ${title.toLowerCase()} provider India, top rated ${title.toLowerCase()} services`;
      slug = toSlug(title);
    }

    return { seoTitle, seoMetaDesc, seoKeywords, geoKeywords, longTailKeywords, aiPhrases, slug };
  }

  // ─── Fill form fields ────────────────────────────────────────────────────
  function fillFields(data) {
    function setField(name, value) {
      const el = document.querySelector(`[name="${name}"]`);
      if (el) {
        el.value = value;
        // Trigger input event so any listeners know the value changed
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    setField('seoTitle', data.seoTitle);
    setField('seoMetaDescription', data.seoMetaDesc);
    setField('seoKeywords', data.seoKeywords);
    setField('geoKeywords', data.geoKeywords);
    setField('longTailKeywords', data.longTailKeywords);
    setField('aiSearchPhrases', data.aiPhrases);

    // Only fill slug if it's empty (don't overwrite existing slug on edit)
    const slugField = document.querySelector('[name="slug"]');
    if (slugField && !slugField.value.trim()) {
      slugField.value = data.slug;
    }
  }

  // ─── Show feedback toast ─────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.getElementById('seo-autofill-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'seo-autofill-toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      background: ${type === 'success' ? 'linear-gradient(135deg, #1565c0, #1976d2)' : '#d32f2f'};
      color: white; padding: 14px 20px; border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3); font-size: 14px;
      font-family: 'Inter', sans-serif; display: flex; align-items: center; gap: 10px;
      animation: slideInUp 0.3s ease; max-width: 340px;
    `;
    toast.innerHTML = `
      <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill'}" style="font-size:18px;flex-shrink:0;"></i>
      <span>${message}</span>
    `;
    // Add animation keyframe
    if (!document.getElementById('seo-toast-style')) {
      const style = document.createElement('style');
      style.id = 'seo-toast-style';
      style.textContent = `@keyframes slideInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`;
      document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
  }

  // ─── Main handler: called when button is clicked ─────────────────────────
  window.seoAutoFill = function () {
    const titleEl = document.querySelector('[name="title"]');
    if (!titleEl || !titleEl.value.trim()) {
      showToast('Please fill in the product Title first before auto-generating SEO fields.', 'error');
      titleEl && titleEl.focus();
      return;
    }

    const btn = document.getElementById('seoAutoFillBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Generating...';
    }

    // Small delay for visual feedback
    setTimeout(() => {
      try {
        const data = generateSEO();
        fillFields(data);

        // Scroll SEO section into view
        const seoSection = document.getElementById('seo-section');
        if (seoSection) seoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        showToast('✨ SEO fields auto-generated! Review and adjust as needed.');
      } catch (e) {
        console.error('SEO auto-fill error:', e);
        showToast('Something went wrong. Please try again.', 'error');
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-magic me-1"></i> Auto-Generate SEO';
      }
    }, 400);
  };

})();
