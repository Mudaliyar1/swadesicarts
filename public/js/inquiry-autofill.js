(function () {
  'use strict';

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function setValue(selector, value, root) {
    const el = qs(selector, root);
    if (!el || value == null || value === '') return;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function ensureAutocomplete(form) {
    const map = {
      name: 'name',
      email: 'email',
      mobile: 'tel',
      phone: 'tel',
      address: 'street-address',
      requirement: 'off'
    };

    Object.keys(map).forEach(function (field) {
      const el = qs(`[name="${field}"]`, form);
      if (el && !el.getAttribute('autocomplete')) {
        el.setAttribute('autocomplete', map[field]);
      }
    });
  }

  function buildRequirementText(prefill) {
    const title = prefill.productTitle || prefill.packageName || 'this product';
    const category = prefill.productCategory ? ` (${prefill.productCategory})` : '';
    const price = prefill.productPrice ? ` Price: ${prefill.productPrice}.` : '';
    const description = prefill.productDescription ? ` ${prefill.productDescription}` : '';
    return `Hi, I am interested in ${title}${category}.${price}${description} Please share more details regarding pricing, delivery, and availability.`.replace(/\s+/g, ' ').trim();
  }

  function initForm(form) {
    if (!form) return;
    ensureAutocomplete(form);

    const prefill = window.__INQUIRY_PREFILL__ || {};
    const productSelect = qs('[name="productId"]', form);
    const hiddenFields = {
      productTitle: qs('[name="productTitle"]', form),
      productCategory: qs('[name="productCategory"]', form),
      productPrice: qs('[name="productPrice"]', form),
      productType: qs('[name="productType"]', form),
      packageName: qs('[name="packageName"]', form)
    };

    function syncFromOption() {
      if (!productSelect) return;
      const option = productSelect.selectedOptions && productSelect.selectedOptions[0] ? productSelect.selectedOptions[0] : null;
      if (!option) return;

      if (hiddenFields.productTitle) hiddenFields.productTitle.value = option.dataset.title || option.textContent.trim();
      if (hiddenFields.productCategory) hiddenFields.productCategory.value = option.dataset.category || '';
      if (hiddenFields.productPrice) hiddenFields.productPrice.value = option.dataset.price || '';
      if (hiddenFields.productType) hiddenFields.productType.value = option.dataset.type || hiddenFields.productType.value || '';
      if (hiddenFields.packageName) hiddenFields.packageName.value = option.dataset.title || option.textContent.trim();

      const messageField = qs('[name="requirement"]', form);
      if (messageField && !messageField.dataset.userEdited) {
        messageField.value = buildRequirementText({
          productTitle: hiddenFields.productTitle ? hiddenFields.productTitle.value : '',
          productCategory: hiddenFields.productCategory ? hiddenFields.productCategory.value : '',
          productPrice: hiddenFields.productPrice ? hiddenFields.productPrice.value : '',
          productDescription: option.dataset.description || '',
          packageName: hiddenFields.packageName ? hiddenFields.packageName.value : ''
        });
        messageField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    if (prefill.productId && productSelect) {
      productSelect.value = prefill.productId;
      productSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (prefill.productTitle) {
      setValue('[name="productTitle"]', prefill.productTitle, form);
    }
    if (prefill.productCategory) {
      setValue('[name="productCategory"]', prefill.productCategory, form);
    }
    if (prefill.productPrice) {
      setValue('[name="productPrice"]', prefill.productPrice, form);
    }
    if (prefill.productType) {
      setValue('[name="productType"]', prefill.productType, form);
    }
    if (prefill.packageName) {
      setValue('[name="packageName"]', prefill.packageName, form);
    }

    if (productSelect) {
      productSelect.addEventListener('change', syncFromOption);
      syncFromOption();
    }

    const messageField = qs('[name="requirement"]', form);
    if (messageField) {
      messageField.addEventListener('input', function () {
        if (this.value.trim()) {
          this.dataset.userEdited = 'true';
        }
      });
    }

    if (messageField && !messageField.value.trim() && prefill.autoRequirement !== false) {
      messageField.value = buildRequirementText(prefill);
      messageField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form[data-inquiry-autofill="true"]').forEach(initForm);
  });
})();