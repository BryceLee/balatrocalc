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
  const CHECKOUT_SOURCE = 'seed_analyzer_paywall';
  const FEATURE_LABELS = {
    seed: 'Seed'
  };
  const SOURCE_PARAMS = {
    source: 'source',
    token: 'sourceToken'
  };

  let quotaRemainingEl;
  let quotaTotalEl;
  let quotaPlanEl;
  let quotaResetEl;
  let quotaLibraryLink;
  let quotaUserEl;
  let quotaEmailEl;
  let quotaLogoutBtn;
  let manageBtn;
  let paywall;
  let paywallClose;
  let paywallEmail;
  let paywallPay;
  let paywallCheck;
  let paywallStatus;
  let paywallMember;
  let paywallMemberPlan;
  let paywallMemberEmail;
  let paywallMemberExpires;
  let paywallUpgrade;
  let paywallManage;
  let paywallLogout;
  let paywallSupportEmail;
  let toastEl;
  let toastTimer;
  let skipProgrammaticAnalyzeCountUntil = 0;
  let decorateBlueprintQueued = false;
  let seedChromeResizeObserver;

  function init() {
    quotaRemainingEl = document.getElementById('seedQuotaRemaining');
    quotaTotalEl = document.getElementById('seedQuotaTotal');
    quotaPlanEl = document.getElementById('seedQuotaPlan');
    quotaResetEl = document.getElementById('seedQuotaReset');
    quotaLibraryLink = document.getElementById('seedQuotaLibraryLink');
    quotaUserEl = document.getElementById('seedQuotaUser');
    quotaEmailEl = document.getElementById('seedQuotaEmail');
    quotaLogoutBtn = document.getElementById('seedQuotaLogout');
    manageBtn = document.getElementById('seedQuotaManage');
    paywall = document.getElementById('seedPaywall');
    paywallClose = document.getElementById('seedPaywallClose');
    paywallEmail = document.getElementById('seedPaywallEmail');
    paywallPay = document.getElementById('seedPaywallPay');
    paywallCheck = document.getElementById('seedPaywallCheck');
    paywallStatus = document.getElementById('seedPaywallStatus');
    paywallMember = document.getElementById('seedPaywallMember');
    paywallMemberPlan = document.getElementById('seedPaywallMemberPlan');
    paywallMemberEmail = document.getElementById('seedPaywallMemberEmail');
    paywallMemberExpires = document.getElementById('seedPaywallMemberExpires');
    paywallUpgrade = document.getElementById('seedPaywallUpgrade');
    paywallManage = document.getElementById('seedPaywallManage');
    paywallLogout = document.getElementById('seedPaywallLogout');
    paywallSupportEmail = document.getElementById('seedPaywallSupportEmail');
    toastEl = document.getElementById('seedToast');

    if (!quotaRemainingEl || !quotaTotalEl || !quotaPlanEl || !quotaResetEl) return false;
    if (!quotaUserEl || !quotaEmailEl || !quotaLogoutBtn) return false;
    if (!manageBtn || !paywall || !paywallClose || !paywallEmail || !paywallPay || !paywallCheck || !paywallStatus) return false;
    if (!paywallMember || !paywallMemberPlan || !paywallMemberEmail || !paywallMemberExpires || !paywallUpgrade) return false;

    ensureDeviceId();
    hydrateEmail();
    updateQuotaUI();
    refreshSubscriptionState();
    consumeSeedGeneratorRedirect();
    setupPaywallActions();
    setupAnalyzeIntercept();
    handlePaypalReturn();
    ensureQuotaBarPlacement();
    setupSeedChromeOffset();
    ensureBlueprintStyleHooks();

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

  function formatPlanPeriodLabel(plan) {
    const parsed = parsePlan(plan);
    if (!parsed) return plan || '';
    return PLAN_LABELS[parsed.period] || parsed.period;
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
    const email = paid.email || localStorage.getItem(STORAGE_KEYS.paidEmail) || '';
    if (quotaLibraryLink) {
      quotaLibraryLink.textContent = paid.active
        ? 'Shared with VIP Seed Pro Library.'
        : 'Upgrade once to unlock analyzer + seed library.';
      quotaLibraryLink.classList.add('active');
    }
    if (paid.active) {
      quotaRemainingEl.textContent = 'Seed Pro';
      quotaTotalEl.textContent = '';
      quotaPlanEl.textContent = paid.plan ? formatPlanPeriodLabel(paid.plan) : 'Active';
      const parsed = parsePlan(paid.plan);
      if (parsed && parsed.period === 'lifetime') {
        quotaResetEl.textContent = 'Lifetime access';
      } else if (paid.expiresAt) {
        quotaResetEl.textContent = `Until ${formatDate(paid.expiresAt)}`;
      } else {
        quotaResetEl.textContent = 'Subscription active';
      }
      manageBtn.textContent = 'Manage';
      setUserEmail(email);
      updatePaywallMembership(paid);
      return;
    }

    const remaining = remainingUses();
    quotaRemainingEl.textContent = `${remaining} free`;
    quotaTotalEl.textContent = remaining === 1 ? 'run' : 'runs';
    quotaPlanEl.textContent = 'today';
    quotaResetEl.textContent = 'Reset 00:00 UTC';
    manageBtn.textContent = 'Unlock';
    setUserEmail(email);
    updatePaywallMembership(paid);
  }

  function setUserEmail(email) {
    if (!email) {
      quotaUserEl.classList.remove('active');
      quotaEmailEl.textContent = '';
      return;
    }
    quotaEmailEl.textContent = email;
    quotaUserEl.classList.add('active');
  }

  function updatePaywallMembership(paid) {
    if (!paywallMember) return;
    if (!paid || !paid.active) {
      paywallMember.classList.remove('active');
      paywallMemberPlan.textContent = '';
      paywallMemberEmail.textContent = '';
      paywallMemberExpires.textContent = '';
      return;
    }
    paywallMember.classList.add('active');
    paywallMemberPlan.textContent = paid.plan
      ? `Seed Pro · ${formatPlanPeriodLabel(paid.plan)}`
      : 'Seed Pro';
    paywallMemberEmail.textContent = paid.email || '';
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

  function clearPaidInfo() {
    localStorage.removeItem(STORAGE_KEYS.paidEmail);
    localStorage.removeItem(STORAGE_KEYS.paidFeatures);
    updateQuotaUI();
  }

  function clearPaidFeature(featureKey) {
    const data = loadPaidFeatures();
    if (!data[featureKey]) return;
    delete data[featureKey];
    savePaidFeatures(data);
  }

  function replaceUrlWithParams(params) {
    const query = params.toString();
    const hash = window.location.hash || '';
    const nextUrl = query ? `${window.location.pathname}?${query}${hash}` : `${window.location.pathname}${hash}`;
    window.history.replaceState({}, '', nextUrl);
  }

  function consumeSeedGeneratorRedirect() {
    const params = new URLSearchParams(window.location.search);
    const source = params.get(SOURCE_PARAMS.source);
    const sourceToken = params.get(SOURCE_PARAMS.token);

    if (!source && !sourceToken) return;

    params.delete(SOURCE_PARAMS.source);
    params.delete(SOURCE_PARAMS.token);

    const isGeneratorSource = source === 'seed-generator' && Boolean(sourceToken);
    if (!isGeneratorSource) {
      replaceUrlWithParams(params);
      return;
    }

    const sourceHandleKey = `bc_source_seed_${getTodayKey()}_${sourceToken}`;
    let alreadyHandled = false;
    try {
      alreadyHandled = sessionStorage.getItem(sourceHandleKey) === '1';
      if (!alreadyHandled) {
        sessionStorage.setItem(sourceHandleKey, '1');
      }
    } catch {
      // Ignore storage restrictions and continue without dedupe fallback.
    }

    if (alreadyHandled) {
      replaceUrlWithParams(params);
      return;
    }

    const paid = getPaidInfo();
    if (!paid.active) {
      if (remainingUses() <= 0) {
        params.delete('seed');
        setStatus('Daily free limit reached. Subscribe for unlimited access.', true);
        showPaywall();
      } else {
        recordUse();
        updateQuotaUI();
        skipProgrammaticAnalyzeCountUntil = Date.now() + 5000;
      }
    }

    replaceUrlWithParams(params);
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

  function getCheckoutSourceMeta() {
    return {
      page: window.location.pathname,
      component: 'seed-paywall',
      cta: 'upgrade_pro',
      feature: FEATURE_KEY
    };
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
      closePaywallWithToast('Subscription confirmed. Access unlocked.');
    } catch (error) {
      setStatus(error.message || 'Subscription check failed.', true);
    }
  }

  async function refreshSubscriptionState() {
    const cachedEmail = normalizeEmail(localStorage.getItem(STORAGE_KEYS.paidEmail) || paywallEmail?.value || '');
    if (!validateEmail(cachedEmail)) return;

    try {
      const data = await getJson(`/api/subscription?email=${encodeURIComponent(cachedEmail)}&feature=${encodeURIComponent(FEATURE_KEY)}`);
      if (data.active) {
        setPaidInfo(data.email || cachedEmail, data.plan || `${FEATURE_KEY}-monthly`, data.expiresAt || null);
      } else {
        clearPaidFeature(FEATURE_KEY);
      }
      updateQuotaUI();
    } catch {
      // Keep the last known local state when the network or API is unavailable.
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
      const data = await postJson(endpoint, {
        email,
        plan,
        returnPath: window.location.pathname,
        checkoutSource: CHECKOUT_SOURCE,
        checkoutSourceMeta: getCheckoutSourceMeta()
      });
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
          closePaywallWithToast('Subscription confirmed. Access unlocked.');
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
          closePaywallWithToast('Subscription confirmed. Access unlocked.');
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
    if (paywallManage) {
      paywallManage.addEventListener('click', () => {
        const host = window.location.hostname;
        const isSandbox = host.includes('pages.dev') || host.includes('localhost') || host.includes('127.0.0.1');
        const base = isSandbox ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com';
        window.open(`${base}/myaccount/autopay/`, '_blank', 'noopener');
      });
    }
    if (paywallLogout) {
      paywallLogout.addEventListener('click', () => {
        clearPaidInfo();
        paywallEmail.value = '';
        setStatus('Logged out on this device.', false, true);
      });
    }
    if (paywallSupportEmail) {
      paywallSupportEmail.addEventListener('click', () => {
        const email = paywallSupportEmail.dataset.email || paywallSupportEmail.textContent || '';
        if (!email) return;
        copyTextWithFeedback(
          email,
          'Support email copied.',
          'Unable to copy email. Please copy manually.'
        );
      });
    }
    quotaLogoutBtn.addEventListener('click', () => {
      clearPaidInfo();
      paywallEmail.value = '';
      showPaywall();
    });
  }

  function copyTextWithFeedback(text, successMessage, failMessage) {
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage);
      }).catch(() => {
        fallbackCopy(text, successMessage, failMessage);
      });
      return;
    }
    fallbackCopy(text, successMessage, failMessage);
  }

  function fallbackCopy(text, successMessage, failMessage) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      showToast(successMessage);
    } catch {
      setStatus(failMessage, true);
    } finally {
      document.body.removeChild(input);
    }
  }

  function isSeedInputField(input) {
    if (!input || input.disabled) return false;
    const type = (input.getAttribute('type') || 'text').toLowerCase();
    if (type === 'hidden' || type === 'email') return false;
    const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    const name = (input.getAttribute('name') || '').toLowerCase();
    const id = (input.getAttribute('id') || '').toLowerCase();
    return placeholder.includes('seed') || ariaLabel.includes('seed') || name.includes('seed') || id.includes('seed');
  }

  function syncSeedChromeOffset() {
    const chrome = document.getElementById('seedChrome');
    if (!chrome) return;
    const offset = Math.ceil(chrome.getBoundingClientRect().height);
    document.body.style.setProperty('--seed-top-offset', `${offset}px`);
  }

  function setupSeedChromeOffset() {
    const chrome = document.getElementById('seedChrome');
    if (!chrome) return;
    syncSeedChromeOffset();
    window.addEventListener('resize', syncSeedChromeOffset, { passive: true });
    if (typeof ResizeObserver === 'function') {
      seedChromeResizeObserver?.disconnect?.();
      seedChromeResizeObserver = new ResizeObserver(() => {
        syncSeedChromeOffset();
      });
      seedChromeResizeObserver.observe(chrome);
    }
  }

  function attachQuotaBarToHeaderRow() {
    const quotaBar = document.getElementById('seedQuotaBar');
    const root = document.getElementById('root');
    if (!quotaBar || !root) return false;
    const searchInput = root.querySelector('input[placeholder*="Search"], input[aria-label*="Search"]');
    const candidates = root.querySelectorAll('h1, h2, [role="heading"]');
    let title = null;
    for (const candidate of candidates) {
      const text = (candidate.textContent || '').trim().toLowerCase();
      if (text.includes('balatro seed analyzer')) {
        title = candidate;
        break;
      }
    }
    if (!title || !searchInput) return false;

    let host = searchInput.parentElement;
    while (host && host !== root && !host.contains(title)) {
      host = host.parentElement;
    }
    if (!host || host === root) return false;
    if (title.parentElement && title.parentElement === host) {
      title.insertAdjacentElement('afterend', quotaBar);
    } else {
      host.insertBefore(quotaBar, searchInput.closest('div') || searchInput);
    }
    host.classList.add('seedQuotaBarHost');
    quotaBar.classList.add('seedQuotaBar--inline');
    return true;
  }

  function attachQuotaBarToTabs() {
    const quotaBar = document.getElementById('seedQuotaBar');
    const root = document.getElementById('root');
    if (!quotaBar || !root) return false;
    const tabList = root.querySelector('[role="tablist"]');
    if (!tabList) return false;
    const container = tabList.parentElement;
    if (!container || container.contains(quotaBar)) {
      quotaBar.classList.remove('seedQuotaBar--inline');
      return true;
    }
    container.insertBefore(quotaBar, tabList);
    quotaBar.classList.remove('seedQuotaBar--inline');
    return true;
  }

  function ensureQuotaBarPlacement() {
    const quotaAnchor = document.getElementById('seedQuotaAnchor');
    const navRow = document.getElementById('seedNavRow');
    const quotaBar = document.getElementById('seedQuotaBar');
    if (quotaAnchor && quotaBar) {
      if (!quotaAnchor.contains(quotaBar)) {
        quotaAnchor.appendChild(quotaBar);
      }
      quotaBar.classList.remove('seedQuotaBar--inline');
      return;
    }
    if (navRow && quotaBar) {
      const topNav = document.getElementById('topNav');
      if (!navRow.contains(quotaBar)) {
        navRow.insertBefore(quotaBar, topNav || null);
      }
      quotaBar.classList.remove('seedQuotaBar--inline');
      return;
    }
    if (attachQuotaBarToHeaderRow()) return;
    if (attachQuotaBarToTabs()) return;
    const root = document.getElementById('root');
    if (!root) return;
    const observer = new MutationObserver(() => {
      if (attachQuotaBarToHeaderRow() || attachQuotaBarToTabs()) {
        observer.disconnect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function isAnalyzeButton(button) {
    const text = (button.textContent || '').trim().toLowerCase();
    const label = (button.getAttribute('aria-label') || '').trim().toLowerCase();
    return (text.includes('analyze') && text.includes('seed')) ||
      (label.includes('analyze') && label.includes('seed'));
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function getButtonLabel(button) {
    return normalizeText(button?.textContent || button?.getAttribute('aria-label') || '');
  }

  function decorateBlueprintUI() {
    const root = document.getElementById('root');
    if (!root) return false;

    const shell = root.querySelector('.mantine-AppShell-root');
    if (!shell) return false;

    shell.classList.add('seedBlueprintShell');
    shell.querySelector('.mantine-AppShell-header')?.classList.add('seedBlueprintHeader');

    const navbar = shell.querySelector('.mantine-AppShell-navbar');
    const aside = shell.querySelector('.mantine-AppShell-aside');
    const main = shell.querySelector('.mantine-AppShell-main');
    const navbarSections = Array.from(navbar?.querySelectorAll(':scope > .mantine-AppShell-section') || []);

    navbar?.classList.add('seedBlueprintNavbar');
    aside?.classList.add('seedBlueprintAside');
    main?.classList.add('seedBlueprintMain');
    navbarSections[0]?.classList.add('seedBlueprintNavbarHead');
    navbarSections[2]?.classList.add('seedBlueprintNavbarActions');
    navbar?.querySelector('.mantine-SegmentedControl-root')?.classList.add('seedBlueprintTabs');
    navbar?.querySelector('.mantine-ScrollArea-root[data-grow="true"]')?.classList.add('seedBlueprintControlPanel');

    const themeRow = Array.from(navbar?.querySelectorAll('.mantine-Group-root') || []).find((group) => {
      const text = normalizeText(group.textContent);
      return text === 'theme';
    });
    themeRow?.classList.add('seedBlueprintThemeRow');

    const actionStack = Array.from(navbar?.querySelectorAll('.mantine-Stack-root') || []).find((stack) => {
      const text = normalizeText(stack.textContent);
      return text.includes('features') && text.includes('modify unlocks') && text.includes('seed summary');
    });

    if (actionStack) {
      actionStack.classList.add('seedBlueprintActionStack');
      actionStack.querySelector('.mantine-Group-root[data-grow="true"]')?.classList.add('seedBlueprintActionGroup');
      Array.from(actionStack.querySelectorAll('button')).forEach((button) => {
        const label = getButtonLabel(button);
        if (label === 'analyze seed') {
          button.classList.add('seedBlueprintSidebarAnalyze');
        } else if (label === 'features') {
          button.classList.add('seedBlueprintSidebarAction', 'seedBlueprintSidebarAction--features');
        } else if (label === 'modify unlocks') {
          button.classList.add('seedBlueprintSidebarAction', 'seedBlueprintSidebarAction--unlocks');
        } else if (label === 'seed summary') {
          button.classList.add('seedBlueprintSidebarAction', 'seedBlueprintSidebarAction--summary');
        } else if (label === 'reset') {
          button.classList.add('seedBlueprintSidebarAction', 'seedBlueprintSidebarAction--reset');
        }
      });
    }

    const introHeading = Array.from(main?.querySelectorAll('h1, h2') || []).find((heading) => {
      const text = normalizeText(heading.textContent);
      return text.includes('fully featured') && text.includes('seed-routing');
    });

    if (introHeading) {
      main?.classList.add('seedBlueprintMain--home');
      main?.classList.remove('seedBlueprintMain--results');
      const introBlock = introHeading.closest('[class*="_inner_"]') || introHeading.parentElement;
      introBlock?.classList.add('seedBlueprintIntro');

      const introWrap = introBlock?.closest('[class*="_wrapper_"]');
      introWrap?.classList.add('seedBlueprintIntroWrap');

      const introControls = Array.from(introBlock?.querySelectorAll('div') || []).find((node) => {
        return Array.from(node.querySelectorAll('button')).some((button) => getButtonLabel(button) === 'analyze seed');
      });

      introControls?.classList.add('seedBlueprintSearchShell');
      introControls?.querySelector('.mantine-Paper-root')?.classList.add('seedBlueprintSearchCard');

      const searchButton = Array.from(introControls?.querySelectorAll('button') || []).find((button) => {
        return getButtonLabel(button) === 'analyze seed';
      });
      searchButton?.classList.add('seedBlueprintSearchButton');

      const introSpacer = introWrap?.nextElementSibling;
      if (introSpacer && !normalizeText(introSpacer.textContent)) {
        introSpacer.classList.add('seedBlueprintIntroSpacer');
      }
    } else {
      main?.classList.remove('seedBlueprintMain--home');
    }

    const benefitPanel = Array.from(main?.querySelectorAll('.mantine-Paper-root') || []).find((paper) => {
      const text = normalizeText(paper.textContent);
      return text.includes('accuracy') && text.includes('card spoilers') && text.includes('shareable routes');
    });
    benefitPanel?.classList.add('seedBlueprintBenefitPanel');

    const resultTabs = Array.from(main?.querySelectorAll('.mantine-Tabs-root') || []).find((tabs) => {
      const text = normalizeText(tabs.textContent);
      return text.includes('ante 1') && text.includes('small blind') && text.includes('boss blind');
    });

    if (resultTabs) {
      main?.classList.add('seedBlueprintMain--results');
      const resultHeader = Array.from(main?.children || []).find((child) => {
        return child.querySelector('.mantine-SegmentedControl-root') && child.querySelector('.mantine-InputWrapper-root');
      });
      resultHeader?.classList.add('seedBlueprintResultHeader');
      resultHeader?.querySelector('.mantine-SegmentedControl-root')?.classList.add('seedBlueprintBlindTabs');

      resultTabs.classList.add('seedBlueprintAnteTabs');
      resultTabs.querySelector('.mantine-Tabs-list')?.classList.add('seedBlueprintAnteList');
      Array.from(resultTabs.querySelectorAll('.mantine-Tabs-panel')).forEach((panel) => {
        panel.classList.add('seedBlueprintAntePanel');
      });
    } else {
      main?.classList.remove('seedBlueprintMain--results');
    }

    return true;
  }

  function scheduleBlueprintDecorate() {
    if (decorateBlueprintQueued) return;
    decorateBlueprintQueued = true;
    requestAnimationFrame(() => {
      decorateBlueprintQueued = false;
      decorateBlueprintUI();
    });
  }

  function ensureBlueprintStyleHooks() {
    const root = document.getElementById('root');
    if (!root) return;
    scheduleBlueprintDecorate();
    const observer = new MutationObserver(() => {
      scheduleBlueprintDecorate();
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function setupAnalyzeIntercept() {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const button = target.closest('button');
      if (!button || !isAnalyzeButton(button)) return;
      if (!event.isTrusted && Date.now() < skipProgrammaticAnalyzeCountUntil) return;

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
