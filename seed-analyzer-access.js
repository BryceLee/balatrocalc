(function () {
  const FEATURE_KEY = 'seed_analyzer';
  const FREE_DAILY_LIMIT = 3;
  const STORAGE_KEYS = {
    deviceId: 'bc_device_id',
    usage: 'bc_usage_daily',
    paidEmail: 'bc_paid_email',
    paidUntil: 'bc_paid_until',
    paidPlan: 'bc_paid_plan'
  };
  const PLAN_LABELS = {
    monthly: 'Monthly',
    yearly: 'Yearly',
    lifetime: 'Lifetime'
  };

  let quotaRemainingEl;
  let quotaTotalEl;
  let quotaPlanEl;
  let quotaResetEl;
  let manageBtn;
  let paywall;
  let paywallClose;
  let paywallEmail;
  let paywallPay;
  let paywallCheck;
  let paywallStatus;

  function init() {
    quotaRemainingEl = document.getElementById('seedQuotaRemaining');
    quotaTotalEl = document.getElementById('seedQuotaTotal');
    quotaPlanEl = document.getElementById('seedQuotaPlan');
    quotaResetEl = document.getElementById('seedQuotaReset');
    manageBtn = document.getElementById('seedQuotaManage');
    paywall = document.getElementById('seedPaywall');
    paywallClose = document.getElementById('seedPaywallClose');
    paywallEmail = document.getElementById('seedPaywallEmail');
    paywallPay = document.getElementById('seedPaywallPay');
    paywallCheck = document.getElementById('seedPaywallCheck');
    paywallStatus = document.getElementById('seedPaywallStatus');

    if (!quotaRemainingEl || !quotaTotalEl || !quotaPlanEl || !quotaResetEl) return false;
    if (!manageBtn || !paywall || !paywallClose || !paywallEmail || !paywallPay || !paywallCheck || !paywallStatus) return false;

    ensureDeviceId();
    hydrateEmail();
    updateQuotaUI();
    setupPaywallActions();
    setupAnalyzeIntercept();
    handlePaypalReturn();

    return true;
  }

  function ensureDeviceId() {
    let id = localStorage.getItem(STORAGE_KEYS.deviceId);
    if (!id) {
      id = `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      localStorage.setItem(STORAGE_KEYS.deviceId, id);
    }
    return id;
  }

  function hydrateEmail() {
    const email = localStorage.getItem(STORAGE_KEYS.paidEmail);
    if (email) paywallEmail.value = email;
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadUsage() {
    const raw = localStorage.getItem(STORAGE_KEYS.usage);
    if (!raw) return {};
    try {
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }

  function saveUsage(data) {
    localStorage.setItem(STORAGE_KEYS.usage, JSON.stringify(data));
  }

  function getUsageEntry(data) {
    const today = getTodayKey();
    if (!data[FEATURE_KEY] || data[FEATURE_KEY].date !== today) {
      data[FEATURE_KEY] = { date: today, used: 0 };
      saveUsage(data);
    }
    return data[FEATURE_KEY];
  }

  function remainingUses() {
    const data = loadUsage();
    const entry = getUsageEntry(data);
    return Math.max(0, FREE_DAILY_LIMIT - entry.used);
  }

  function recordUse() {
    const data = loadUsage();
    const entry = getUsageEntry(data);
    entry.used += 1;
    saveUsage(data);
  }

  function getPaidInfo() {
    const plan = localStorage.getItem(STORAGE_KEYS.paidPlan);
    const email = localStorage.getItem(STORAGE_KEYS.paidEmail);
    if (!plan) return { active: false };
    if (plan === 'lifetime') {
      return { active: true, plan, email, expiresAt: null };
    }
    const until = localStorage.getItem(STORAGE_KEYS.paidUntil);
    if (!until) return { active: false };
    const active = new Date(until).getTime() > Date.now();
    return { active, plan, email, expiresAt: until };
  }

  function setPaidInfo(email, plan, expiresAt) {
    localStorage.setItem(STORAGE_KEYS.paidEmail, email);
    localStorage.setItem(STORAGE_KEYS.paidPlan, plan);
    if (expiresAt) {
      localStorage.setItem(STORAGE_KEYS.paidUntil, expiresAt);
    } else {
      localStorage.removeItem(STORAGE_KEYS.paidUntil);
    }
  }

  function formatDate(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toISOString().slice(0, 10);
  }

  function updateQuotaUI() {
    const paid = getPaidInfo();
    if (paid.active) {
      quotaRemainingEl.textContent = 'Unlimited';
      quotaTotalEl.textContent = '';
      quotaPlanEl.textContent = paid.plan ? `Plan: ${PLAN_LABELS[paid.plan] || paid.plan}` : '';
      if (paid.plan === 'lifetime') {
        quotaResetEl.textContent = 'Lifetime access';
      } else if (paid.expiresAt) {
        quotaResetEl.textContent = `Valid until ${formatDate(paid.expiresAt)} UTC`;
      } else {
        quotaResetEl.textContent = 'Subscription active';
      }
      return;
    }

    const remaining = remainingUses();
    quotaRemainingEl.textContent = String(remaining);
    quotaTotalEl.textContent = `/${FREE_DAILY_LIMIT}`;
    quotaPlanEl.textContent = '';
    quotaResetEl.textContent = 'Resets daily at 00:00 UTC';
  }

  function showPaywall() {
    paywall.classList.add('active');
  }

  function hidePaywall() {
    paywall.classList.remove('active');
  }

  function setStatus(message, isError) {
    paywallStatus.textContent = message || '';
    paywallStatus.classList.toggle('error', Boolean(isError));
  }

  function clearStatus() {
    setStatus('', false);
  }

  function getSelectedPlan() {
    const selected = document.querySelector('input[name="seedPlan"]:checked');
    return selected ? selected.value : 'monthly';
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function getJson(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  async function checkSubscription() {
    clearStatus();
    const email = normalizeEmail(paywallEmail.value);
    if (!validateEmail(email)) {
      setStatus('Enter a valid email.', true);
      return;
    }
    try {
      const data = await getJson(`/api/subscription?email=${encodeURIComponent(email)}`);
      if (!data.active) {
        setStatus('No active subscription found.', true);
        return;
      }
      setPaidInfo(email, data.plan || 'monthly', data.expiresAt || null);
      updateQuotaUI();
      setStatus('Subscription active. Access unlocked on this device.', false);
    } catch (error) {
      setStatus(error.message || 'Subscription check failed.', true);
    }
  }

  async function startPayment() {
    clearStatus();
    const email = normalizeEmail(paywallEmail.value);
    if (!validateEmail(email)) {
      setStatus('Enter a valid email before paying.', true);
      return;
    }
    const plan = getSelectedPlan();
    const endpoint = plan === 'lifetime' ? '/api/paypal/create-order' : '/api/paypal/create-subscription';
    try {
      setStatus('Redirecting to PayPal...', false);
      const data = await postJson(endpoint, { email, plan });
      if (!data.approvalUrl) {
        setStatus('Missing PayPal approval link.', true);
        return;
      }
      window.location.href = data.approvalUrl;
    } catch (error) {
      setStatus(error.message || 'Failed to start PayPal checkout.', true);
    }
  }

  async function handlePaypalReturn() {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('paypal');
    if (!state) return;
    showPaywall();
    if (state === 'cancel') {
      setStatus('Payment canceled.', true);
      cleanupPaypalParams(params);
      return;
    }
    if (state !== 'success') return;
    const plan = params.get('plan');
    if (!plan) {
      setStatus('Missing plan info from PayPal.', true);
      cleanupPaypalParams(params);
      return;
    }
    setStatus('Finalizing PayPal...', false);
    try {
      if (plan === 'lifetime') {
        const token = params.get('token');
        if (!token) throw new Error('Missing PayPal order token.');
        const data = await postJson('/api/paypal/capture', { orderId: token });
        if (data.active) {
          setPaidInfo(data.email || normalizeEmail(paywallEmail.value), data.plan, data.expiresAt || null);
          updateQuotaUI();
          setStatus('Payment complete. Access unlocked.', false);
        } else {
          setStatus('Payment pending. Please retry later.', true);
        }
      } else {
        const subscriptionId = params.get('subscription_id');
        if (!subscriptionId) throw new Error('Missing PayPal subscription id.');
        const data = await postJson('/api/paypal/subscription-activate', { subscriptionId });
        if (data.active) {
          setPaidInfo(data.email || normalizeEmail(paywallEmail.value), data.plan, data.expiresAt || null);
          updateQuotaUI();
          setStatus('Subscription active. Access unlocked.', false);
        } else {
          setStatus('Subscription not active yet. Please retry later.', true);
        }
      }
    } catch (error) {
      setStatus(error.message || 'PayPal verification failed.', true);
    }
    cleanupPaypalParams(params);
  }

  function cleanupPaypalParams(params) {
    params.delete('paypal');
    params.delete('plan');
    params.delete('token');
    params.delete('subscription_id');
    params.delete('ba_token');
    params.delete('PayerID');
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  }

  function setupPaywallActions() {
    manageBtn.addEventListener('click', () => showPaywall());
    paywallClose.addEventListener('click', hidePaywall);
    paywall.addEventListener('click', (event) => {
      if (event.target === paywall) hidePaywall();
    });
    paywallPay.addEventListener('click', startPayment);
    paywallCheck.addEventListener('click', checkSubscription);
  }

  function isAnalyzeButton(button) {
    const text = (button.textContent || '').trim().toLowerCase();
    const label = (button.getAttribute('aria-label') || '').trim().toLowerCase();
    return (text.includes('analyze') && text.includes('seed')) ||
      (label.includes('analyze') && label.includes('seed'));
  }

  function setupAnalyzeIntercept() {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const button = target.closest('button');
      if (!button || !isAnalyzeButton(button)) return;

      const paid = getPaidInfo();
      if (paid.active) return;

      if (remainingUses() <= 0) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        setStatus('Daily free limit reached. Subscribe for unlimited access.', true);
        showPaywall();
        return;
      }

      recordUse();
      updateQuotaUI();
    }, true);
  }

  if (!init()) {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();
