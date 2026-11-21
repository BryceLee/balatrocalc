// One small 300x250 Adsterra slot, sandboxed, with a $3 one-time "Remove ads" purchase.
// Hidden for: Seed Pro members (active monthly/yearly or lifetime) and Remove Ads buyers.
// Loaded synchronously right after the slot markup so the PayPal return params are read
// before hand-url.js rewrites the query string.
(function () {
  'use strict';

  const SLOT_ID = 'sideAdSlot';
  const AD_FRAME_SRC = '/adsterra-300x250';
  const NOADS_PLAN = 'noads-lifetime';
  const NOADS_PRICE = '$3';
  const KEYS = { email: 'bc_paid_email', features: 'bc_paid_features' };
  // The ad iframe gets its own opaque origin: it cannot read or touch this page, cannot
  // listen to clicks outside its box, and cannot redirect the tab. allow-popups lets a
  // real click on the ad open the advertiser in a new tab; nothing opens without a click.
  const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';
  // Retention experiment: a random 20% of browsers never see the ad (holdout), so the
  // effect of ads on return visits can be measured against them. The group is sticky per
  // browser. Set HOLDOUT_SHARE to 0 to end the experiment and show ads to everyone.
  const HOLDOUT_SHARE = 0.2;
  const GROUP_KEY = 'bc_ad_group';
  const EXPERIMENT = 'ads_retention_v1';
  // Ads are off for these countries (window.bcCountry is set by functions/_middleware.js).
  // When the country is unknown, no ad is shown either.
  const NO_AD_COUNTRIES = new Set(['US']);

  const initialParams = new URLSearchParams(window.location.search);
  const memory = new Map();

  function read(key) {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) return value;
    } catch { /* storage blocked */ }
    return memory.get(key) || '';
  }

  function write(key, value) {
    memory.set(key, value);
    try { window.localStorage.setItem(key, value); } catch { /* storage blocked */ }
  }

  function loadFeatures() {
    try { return JSON.parse(read(KEYS.features) || '{}') || {}; } catch { return {}; }
  }

  // bc-analytics.js loads deferred, after this script; queue events until it is ready.
  const pending = [];
  let flushTimer = null;
  function flushPending() {
    if (!window.bcAnalytics) return false;
    while (pending.length) {
      const [name, props] = pending.shift();
      try { window.bcAnalytics.track(name, props); } catch { /* ignore */ }
    }
    return true;
  }
  function track(name, props) {
    pending.push([name, props || {}]);
    if (flushPending() || flushTimer) return;
    let tries = 0;
    flushTimer = setInterval(() => {
      tries += 1;
      if (flushPending() || tries > 40) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
    }, 250);
  }

  function adGroup() {
    let group = read(GROUP_KEY);
    if (group !== 'ads' && group !== 'holdout') {
      group = Math.random() < HOLDOUT_SHARE ? 'holdout' : 'ads';
      write(GROUP_KEY, group);
    }
    return HOLDOUT_SHARE > 0 ? group : 'ads';
  }

  // Fires once when the slot actually scrolls into view (at least half visible).
  function watchViewability(slot, group) {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        track('ad_viewed', { experiment: EXPERIMENT, ad_group: group });
      }
    }, { threshold: 0.5 });
    observer.observe(slot);
  }

  function isActive(entry, feature) {
    if (!entry || !entry.plan || String(entry.plan).split('-')[0] !== feature) return false;
    if (/-lifetime$/.test(entry.plan)) return true;
    const expiresAt = entry.expiresAt ? new Date(entry.expiresAt).getTime() : NaN;
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }

  function isAdFree() {
    const features = loadFeatures();
    return isActive(features.noads, 'noads') || isActive(features.seed, 'seed');
  }

  function saveNoAds(email) {
    const features = loadFeatures();
    features.noads = { plan: NOADS_PLAN, expiresAt: null };
    write(KEYS.features, JSON.stringify(features));
    if (email && !read(KEYS.email)) write(KEYS.email, email);
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ---------- slot ----------
  let exposureTracked = false;
  function renderSlot() {
    const slot = document.getElementById(SLOT_ID);
    if (!slot) return;
    const country = typeof window.bcCountry === 'string' ? window.bcCountry : '';
    const geoOff = !country || NO_AD_COUNTRIES.has(country);
    // Geo-excluded visitors are their own group so they never enter the ads/holdout comparison.
    const group = isAdFree() ? 'ad_free' : (geoOff ? 'geo_off' : adGroup());
    if (!exposureTracked) {
      // One event per page view: which experiment arm this visitor is in.
      exposureTracked = true;
      track('ad_exposure', { experiment: EXPERIMENT, ad_group: group, country: country || null });
      if (group === 'ads') watchViewability(slot, group);
    }
    if (group !== 'ads') {
      slot.hidden = true;
      slot.innerHTML = '';
      return;
    }
    if (slot.querySelector('iframe')) {
      slot.hidden = false;
      return;
    }

    const label = document.createElement('div');
    label.className = 'sideAdSlot__label';
    label.innerHTML = '<span>Advertisement</span>';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'sideAdSlot__remove';
    removeBtn.textContent = `Remove ads · ${NOADS_PRICE}`;
    removeBtn.addEventListener('click', () => {
      track('remove_ads_clicked', {});
      openModal();
    });
    label.appendChild(removeBtn);

    const frame = document.createElement('iframe');
    frame.title = 'Advertisement';
    frame.width = '300';
    frame.height = '250';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.setAttribute('sandbox', SANDBOX);
    frame.src = AD_FRAME_SRC;

    slot.appendChild(label);
    slot.appendChild(frame);
    slot.hidden = false;
  }

  // ---------- remove-ads modal ----------
  let modal;
  let emailInput;
  let statusEl;

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  function buildModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'removeAdsModal';
    modal.className = 'removeAdsModal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="removeAdsModal__box" role="dialog" aria-modal="true" aria-labelledby="removeAdsTitle">
        <button type="button" class="removeAdsModal__close" aria-label="Close">&times;</button>
        <h2 id="removeAdsTitle">Remove ads for good</h2>
        <p>Pay <strong>${NOADS_PRICE} once</strong> and the ad slot disappears in this browser. No subscription.</p>
        <p class="removeAdsModal__note">Seed Pro members already browse ad-free.</p>
        <label for="removeAdsEmail">Email (used to restore on another device)</label>
        <input id="removeAdsEmail" type="email" placeholder="you@example.com" autocomplete="email">
        <button type="button" class="removeAdsModal__pay">Pay ${NOADS_PRICE} with PayPal</button>
        <button type="button" class="removeAdsModal__restore">Already paid? Restore</button>
        <div class="removeAdsModal__status" aria-live="polite"></div>
      </div>`;
    document.body.appendChild(modal);
    emailInput = modal.querySelector('#removeAdsEmail');
    statusEl = modal.querySelector('.removeAdsModal__status');
    emailInput.value = read(KEYS.email);
    modal.querySelector('.removeAdsModal__close').addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    modal.querySelector('.removeAdsModal__pay').addEventListener('click', startPayment);
    modal.querySelector('.removeAdsModal__restore').addEventListener('click', restore);
  }

  function openModal() {
    buildModal();
    setStatus('');
    modal.hidden = false;
  }

  function closeModal() {
    if (modal) modal.hidden = true;
  }

  async function startPayment() {
    const email = normalizeEmail(emailInput.value);
    track('pay_clicked', { plan: NOADS_PLAN, email_valid: validEmail(email) });
    if (!validEmail(email)) {
      setStatus('Enter a valid email before paying.', true);
      return;
    }
    try {
      setStatus('Redirecting to PayPal...');
      track('checkout_started', { plan: NOADS_PLAN, period: 'lifetime', source: 'remove_ads' });
      const data = await postJson('/api/paypal/create-order', {
        email,
        plan: NOADS_PLAN,
        returnPath: window.location.pathname,
        checkoutSource: 'remove_ads'
      });
      if (!data.approvalUrl) throw new Error('Missing PayPal approval link.');
      window.location.href = data.approvalUrl;
    } catch (error) {
      track('checkout_create_failed', { plan: NOADS_PLAN, reason: error.message || 'request_failed' });
      setStatus(error.message || 'Failed to start PayPal checkout.', true);
    }
  }

  async function restore() {
    const email = normalizeEmail(emailInput.value);
    if (!validEmail(email)) {
      setStatus('Enter the email you paid with.', true);
      return;
    }
    setStatus('Checking...');
    try {
      const res = await fetch(`/api/subscription?email=${encodeURIComponent(email)}&feature=noads`, { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.active) {
        saveNoAds(email);
        renderSlot();
        closeModal();
        return;
      }
      setStatus('No ad-free purchase found for this email.', true);
    } catch {
      setStatus('Could not check right now. Please try again.', true);
    }
  }

  async function handlePaypalReturn() {
    const state = initialParams.get('paypal');
    if (!state || initialParams.get('plan') !== NOADS_PLAN) return;
    const cleaned = new URLSearchParams(window.location.search);
    ['paypal', 'plan', 'token', 'PayerID'].forEach((key) => cleaned.delete(key));
    const query = cleaned.toString();
    window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);

    openModal();
    if (state === 'cancel') {
      track('payment_cancelled', { plan: NOADS_PLAN });
      setStatus('Payment canceled.', true);
      return;
    }
    const token = initialParams.get('token');
    if (state !== 'success' || !token) return;
    setStatus('Finalizing PayPal...');
    try {
      const data = await postJson('/api/paypal/capture', { orderId: token });
      if (!data.active) {
        setStatus('Payment pending. Please try Restore in a few minutes.', true);
        return;
      }
      saveNoAds(normalizeEmail(data.email));
      track('payment_success', { plan: NOADS_PLAN, period: 'lifetime' });
      renderSlot();
      setStatus('Thanks! Ads are removed.');
      setTimeout(closeModal, 1800);
    } catch (error) {
      setStatus(error.message || 'PayPal verification failed.', true);
    }
  }

  function init() {
    renderSlot();
    handlePaypalReturn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  window.addEventListener('storage', (event) => {
    if (event.key === KEYS.email || event.key === KEYS.features) renderSlot();
  });
})();
