(function () {
  const FEATURE_KEY = 'seed';
  const FREE_DAILY_LIMIT = 3;
  const STORAGE_KEYS = {
    deviceId: 'bc_device_id',
    usage: 'bc_usage_daily',
    paidEmail: 'bc_paid_email',
    paidFeatures: 'bc_paid_features'
  };
  const PLAN_LABELS = {
    monthly: 'Monthly',
    yearly: 'Yearly',
    lifetime: 'Lifetime'
  };
  const FEATURE_LABELS = {
    seed: 'Seed'
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
  let paywallMember;
  let paywallMemberPlan;
  let paywallMemberExpires;
  let paywallUpgrade;
  let toastEl;
  let toastTimer;

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
    paywallMember = document.getElementById('seedPaywallMember');
    paywallMemberPlan = document.getElementById('seedPaywallMemberPlan');
    paywallMemberExpires = document.getElementById('seedPaywallMemberExpires');
    paywallUpgrade = document.getElementById('seedPaywallUpgrade');
    toastEl = document.getElementById('seedToast');

    if (!quotaRemainingEl || !quotaTotalEl || !quotaPlanEl || !quotaResetEl) return false;
    if (!manageBtn || !paywall || !paywallClose || !paywallEmail || !paywallPay || !paywallCheck || !paywallStatus) return false;
    if (!paywallMember || !paywallMemberPlan || !paywallMemberExpires || !paywallUpgrade) return false;

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

  function loadPaidFeatures() {
    const raw = localStorage.getItem(STORAGE_KEYS.paidFeatures);
    if (!raw) return {};
    try {
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }

  function savePaidFeatures(data) {
    localStorage.setItem(STORAGE_KEYS.paidFeatures, JSON.stringify(data));
  }

  function parsePlan(plan) {
    const parts = String(plan || '').split('-');
    if (parts.length !== 2) return null;
    const [feature, period] = parts;
    if (!feature || !period) return null;
    return { feature, period };
  }

  function formatPlanLabel(plan) {
    const parsed = parsePlan(plan);
    if (!parsed) return plan || '';
    const featureLabel = FEATURE_LABELS[parsed.feature] || parsed.feature;
    const periodLabel = PLAN_LABELS[parsed.period] || parsed.period;
    return `${featureLabel} ${periodLabel}`;
  }

  function getPaidInfo() {
    const email = localStorage.getItem(STORAGE_KEYS.paidEmail);
    const data = loadPaidFeatures();
    const entry = data[FEATURE_KEY];
    if (!entry || !entry.plan) return { active: false };

    const parsed = parsePlan(entry.plan);
    if (!parsed || parsed.feature !== FEATURE_KEY) {
      return { active: false };
    }

    if (parsed.period === 'lifetime') {
      return { active: true, plan: entry.plan, email, expiresAt: null };
    }
    if (!entry.expiresAt) return { active: false };
    const active = new Date(entry.expiresAt).getTime() > Date.now();
    return { active, plan: entry.plan, email, expiresAt: entry.expiresAt };
  }

  function setPaidInfo(email, plan, expiresAt) {
    localStorage.setItem(STORAGE_KEYS.paidEmail, email);
    const data = loadPaidFeatures();
    data[FEATURE_KEY] = {
      plan,
      expiresAt: expiresAt || null
    };
    savePaidFeatures(data);
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
      quotaPlanEl.textContent = paid.plan ? `Seed Pro · ${formatPlanLabel(paid.plan)}` : 'Seed Pro';
      const parsed = parsePlan(paid.plan);
      if (parsed && parsed.period === 'lifetime') {
        quotaResetEl.textContent = 'Lifetime access';
      } else if (paid.expiresAt) {
        quotaResetEl.textContent = `Valid until ${formatDate(paid.expiresAt)} UTC`;
      } else {
        quotaResetEl.textContent = 'Subscription active';
      }
      manageBtn.textContent = 'Manage Pro';
      updatePaywallMembership(paid);
      return;
    }

    const remaining = remainingUses();
    quotaRemainingEl.textContent = String(remaining);
    quotaTotalEl.textContent = `/${FREE_DAILY_LIMIT}`;
    quotaPlanEl.textContent = '';
    quotaResetEl.textContent = 'Resets daily at 00:00 UTC';
    manageBtn.textContent = 'Manage Access';
    updatePaywallMembership(paid);
  }

  function updatePaywallMembership(paid) {
    if (!paywallMember) return;
    if (!paid || !paid.active) {
      paywallMember.classList.remove('active');
      paywallMemberPlan.textContent = '';
      paywallMemberExpires.textContent = '';
      return;
    }
    paywallMember.classList.add('active');
    paywallMemberPlan.textContent = paid.plan
      ? `Seed Pro · ${formatPlanLabel(paid.plan)}`
      : 'Seed Pro';
    const parsed = parsePlan(paid.plan);
    if (parsed && parsed.period === 'lifetime') {
      paywallMemberExpires.textContent = 'Lifetime access';
    } else if (paid.expiresAt) {
      paywallMemberExpires.textContent = `Valid until ${formatDate(paid.expiresAt)} UTC`;
    } else {
      paywallMemberExpires.textContent = 'Subscription active';
    }
  }

  function showPaywall() {
    paywall.classList.add('active');
  }

  function hidePaywall() {
    paywall.classList.remove('active');
  }

  function setStatus(message, isError, isSuccess = false) {
    paywallStatus.textContent = message || '';
    paywallStatus.classList.toggle('error', Boolean(isError));
    paywallStatus.classList.toggle('success', Boolean(isSuccess));
  }

  function clearStatus() {
    setStatus('', false);
  }
  
  function showToast(message, durationMs = 2600) {
    if (!toastEl || !message) return;
    toastEl.textContent = message;
    toastEl.classList.add('active');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('active');
    }, durationMs);
  }

  function closePaywallWithToast(message) {
    hidePaywall();
    clearStatus();
    showToast(message);
  }

  function getSelectedPlan() {
    const selected = document.querySelector('input[name="seedPlan"]:checked');
    return selected ? selected.value : `${FEATURE_KEY}-monthly`;
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
      const data = await getJson(`/api/subscription?email=${encodeURIComponent(email)}&feature=${encodeURIComponent(FEATURE_KEY)}`);
      if (!data.active) {
        setStatus('No active subscription found.', true);
        return;
      }
      setPaidInfo(email, data.plan || `${FEATURE_KEY}-monthly`, data.expiresAt || null);
      updateQuotaUI();
      closePaywallWithToast('订阅成功，开始使用产品。');
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
    const parsed = parsePlan(plan);
    if (!parsed) {
      setStatus('Invalid plan selected.', true);
      return;
    }
    const endpoint = parsed.period === 'lifetime' ? '/api/paypal/create-order' : '/api/paypal/create-subscription';
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
    const parsed = parsePlan(plan);
    if (!parsed) {
      setStatus('Invalid plan from PayPal.', true);
      cleanupPaypalParams(params);
      return;
    }
    setStatus('Finalizing PayPal...', false);
    try {
      if (parsed.period === 'lifetime') {
        const token = params.get('token');
        if (!token) throw new Error('Missing PayPal order token.');
        const data = await postJson('/api/paypal/capture', { orderId: token });
        if (data.active) {
          setPaidInfo(data.email || normalizeEmail(paywallEmail.value), data.plan, data.expiresAt || null);
          updateQuotaUI();
          closePaywallWithToast('订阅成功，开始使用产品。');
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
          closePaywallWithToast('订阅成功，开始使用产品。');
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
    paywallUpgrade.addEventListener('click', () => {
      clearStatus();
      const plans = document.querySelector('.seedPaywallPlans');
      if (plans && plans.scrollIntoView) {
        plans.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setStatus('Choose a plan to upgrade or extend.', false);
    });
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
