(function () {
  'use strict';

  const PREVIEW_EMAIL = 'bryceleezx@gmail.com';
  const PAID_EMAIL_KEY = 'bc_paid_email';

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function revealLinks() {
    document.querySelectorAll('[data-ai-preview-nav]').forEach((link) => {
      link.hidden = false;
    });
  }

  async function hasAllowedAiSession() {
    const response = await fetch('/api/ai/account', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => null);
    return normalizeEmail(payload?.user?.email) === PREVIEW_EMAIL;
  }

  async function hasAllowedSeedProMembership() {
    let email = '';
    try {
      email = normalizeEmail(localStorage.getItem(PAID_EMAIL_KEY));
    } catch {
      return false;
    }
    if (email !== PREVIEW_EMAIL) return false;

    const response = await fetch(`/api/subscription?email=${encodeURIComponent(email)}&feature=seed`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => null);
    return payload?.active === true && normalizeEmail(payload.email) === PREVIEW_EMAIL;
  }

  async function updatePreviewNavigation() {
    if (!document.querySelector('[data-ai-preview-nav]')) return;
    const checks = await Promise.allSettled([
      hasAllowedAiSession(),
      hasAllowedSeedProMembership()
    ]);
    if (checks.some((result) => result.status === 'fulfilled' && result.value === true)) {
      revealLinks();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updatePreviewNavigation, { once: true });
  } else {
    updatePreviewNavigation();
  }
}());
