(function () {
  'use strict';

  const GOOGLE_CLIENT_ID = '286347292359-g93pq2e1d7msio01rgt01ojed37es37v.apps.googleusercontent.com';
  const STORAGE_KEY = 'balatro_ai_chat_history_v1';
  const state = {
    user: null,
    account: null,
    sending: false,
    buying: false,
    googleInitialized: false,
    history: loadHistory()
  };

  const elements = {};

  function byId(id) { return document.getElementById(id); }
  function csrfHeaders(extra) { return { 'X-AI-CSRF': '1', ...extra }; }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: csrfHeaders(options.headers || {})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || 'Request failed');
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.slice(-10) : [];
    } catch { return []; }
  }

  function saveHistory() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.history.slice(-10))); } catch { /* ignore */ }
  }

  function formatCredits(value) {
    const number = Number(value || 0);
    return number.toFixed(1);
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function track(name, props) {
    if (typeof window.plausible === 'function') window.plausible(name, { props: props || {} });
  }

  function messageElement(role, content, billing) {
    const article = document.createElement('article');
    article.className = `aiMessage aiMessage--${role}`;
    const label = document.createElement('div');
    label.className = 'aiMessageRole';
    label.textContent = role === 'assistant' ? 'JOKER ADVISOR' : 'YOU';
    const body = document.createElement('p');
    body.textContent = content;
    article.append(label, body);
    if (billing) {
      const line = document.createElement('div');
      line.className = 'aiBillingLine';
      const charged = document.createElement('strong');
      charged.textContent = billing.status === 'billed'
        ? `${formatCredits(billing.billedCredits)} Credits charged`
        : billing.note || 'No Credits charged';
      line.append(charged);
      if (billing.inputTokens || billing.outputTokens) {
        const tokens = document.createElement('span');
        tokens.textContent = `${Number(billing.inputTokens || 0).toLocaleString()} in · ${Number(billing.outputTokens || 0).toLocaleString()} out`;
        line.append(tokens);
      }
      article.append(line);
    }
    return article;
  }

  function addMessage(role, content, billing, persist = true) {
    const node = messageElement(role, content, billing);
    elements.messages.append(node);
    elements.messages.scrollTop = elements.messages.scrollHeight;
    if (persist) {
      state.history.push({ role, content });
      state.history = state.history.slice(-10);
      saveHistory();
    }
    return node;
  }

  function addLoadingMessage() {
    const article = document.createElement('article');
    article.className = 'aiMessage aiMessage--assistant';
    const label = document.createElement('div');
    label.className = 'aiMessageRole';
    label.textContent = 'JOKER ADVISOR IS THINKING';
    const dots = document.createElement('span');
    dots.className = 'aiLoadingDots';
    dots.innerHTML = '<i></i><i></i><i></i>';
    article.append(label, dots);
    elements.messages.append(article);
    elements.messages.scrollTop = elements.messages.scrollHeight;
    return article;
  }

  function renderLedger() {
    elements.ledger.replaceChildren();
    if (!state.account) {
      const empty = document.createElement('p');
      empty.textContent = 'Sign in to view recent activity.';
      elements.ledger.append(empty);
      return;
    }
    const entries = [];
    for (const topup of state.account.topups || []) {
      entries.push({
        date: topup.createdAt,
        title: `PayPal · ${formatCredits(topup.credits)} Credits`,
        value: `+$${Number(topup.grossAmount).toFixed(2)}`,
        detail: topup.paypalFee === null ? 'Payment completed' : `PayPal fee $${Number(topup.paypalFee).toFixed(2)}`
      });
    }
    for (const usage of state.account.usage || []) {
      entries.push({
        date: usage.createdAt,
        title: usage.status === 'billed' ? 'AI answer' : `AI · ${String(usage.status).replaceAll('_', ' ')}`,
        value: usage.billedCredits ? `−${formatCredits(usage.billedCredits)} cr` : '0.0 cr',
        detail: `${Number(usage.inputTokens || 0).toLocaleString()} in · ${Number(usage.outputTokens || 0).toLocaleString()} out`
      });
    }
    for (const adjustment of state.account.adjustments || []) {
      const restored = Number(adjustment.credits || 0) > 0;
      entries.push({
        date: adjustment.createdAt,
        title: restored ? 'Payment hold released' : 'Payment reversed or disputed',
        value: `${restored ? '+' : '−'}${formatCredits(Math.abs(adjustment.credits))} cr`,
        detail: adjustment.amount === null
          ? String(adjustment.kind || 'Payment adjustment').replaceAll('_', ' ')
          : `$${Number(adjustment.amount).toFixed(2)} · ${String(adjustment.kind || 'adjustment').replaceAll('_', ' ')}`
      });
    }
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No purchases or AI usage yet.';
      elements.ledger.append(empty);
      return;
    }
    for (const entry of entries.slice(0, 20)) {
      const row = document.createElement('div');
      row.className = 'aiLedgerItem';
      const title = document.createElement('strong'); title.textContent = entry.title;
      const value = document.createElement('span'); value.textContent = entry.value;
      const date = document.createElement('small'); date.textContent = formatDate(entry.date);
      const detail = document.createElement('small'); detail.textContent = entry.detail;
      row.append(title, value, date, detail);
      elements.ledger.append(row);
    }
  }

  function render() {
    const signedIn = Boolean(state.user && state.account);
    elements.loginGate.hidden = signedIn;
    elements.chat.hidden = !signedIn;
    elements.accountSignedOut.hidden = signedIn;
    elements.accountSignedIn.hidden = !signedIn;
    elements.balance.textContent = signedIn ? formatCredits(state.account.availableBalance) : '—';
    elements.walletBalance.textContent = signedIn ? formatCredits(state.account.availableBalance) : '0.0';
    const purchaseConfirmed = Boolean(elements.purchaseConsent?.checked);
    for (const button of document.querySelectorAll('.aiPack')) {
      button.disabled = !signedIn || state.buying || !purchaseConfirmed;
    }
    if (signedIn) {
      elements.userName.textContent = state.user.name || 'Balatro player';
      elements.userEmail.textContent = state.user.email || '';
      elements.userPicture.src = state.user.picture || 'assets/favicon.png';
      elements.userPicture.alt = state.user.name ? `${state.user.name} profile` : 'Google profile';
    }
    renderLedger();
  }

  async function refreshAccount() {
    try {
      const payload = await api('/api/ai/account');
      state.user = payload.user;
      state.account = payload.account;
    } catch (error) {
      if (error.status !== 401) console.warn(error);
      state.user = null;
      state.account = null;
    }
    render();
    if (!state.user) window.initBalatroGoogleSignIn();
  }

  async function handleGoogleCredential(response) {
    if (!response?.credential) return;
    elements.purchaseStatus.textContent = 'Verifying Google account…';
    try {
      const payload = await api('/api/ai/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      state.user = payload.user;
      state.account = payload.account;
      elements.purchaseStatus.textContent = '';
      render();
      track('AI Sign In');
      await handlePaypalReturn();
    } catch (error) {
      elements.purchaseStatus.textContent = error.message;
      elements.purchaseStatus.classList.add('is-error');
    }
  }

  window.initBalatroGoogleSignIn = function () {
    if (!window.google?.accounts?.id || state.user || !elements.googleButton || state.googleInitialized) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    state.googleInitialized = true;
    elements.googleButton.replaceChildren();
    window.google.accounts.id.renderButton(elements.googleButton, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width: 280
    });
  };

  async function buyCredits(packageId) {
    if (!state.user || state.buying) return;
    state.buying = true;
    elements.purchaseStatus.classList.remove('is-error');
    elements.purchaseStatus.textContent = 'Opening secure PayPal checkout…';
    render();
    try {
      const payload = await api('/api/ai/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, acceptedTerms: elements.purchaseConsent.checked })
      });
      track('AI Checkout Started', { package: packageId });
      window.location.assign(payload.approvalUrl);
    } catch (error) {
      state.buying = false;
      elements.purchaseStatus.textContent = error.message;
      elements.purchaseStatus.classList.add('is-error');
      render();
    }
  }

  async function handlePaypalReturn() {
    const url = new URL(window.location.href);
    const status = url.searchParams.get('paypal');
    if (!status) return;
    if (status === 'cancel') {
      elements.purchaseStatus.textContent = 'PayPal checkout was cancelled. Nothing was charged.';
      url.searchParams.delete('paypal');
      url.searchParams.delete('package');
      history.replaceState({}, '', url);
      return;
    }
    const orderId = url.searchParams.get('token');
    if (status !== 'success' || !orderId || !state.user) return;
    elements.purchaseStatus.classList.remove('is-error');
    elements.purchaseStatus.textContent = 'Confirming payment and adding Credits…';
    try {
      const payload = await api('/api/ai/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (payload.account) state.account = payload.account;
      elements.purchaseStatus.textContent = payload.credited
        ? 'Credits added. Your advisor is ready.'
        : `Payment status: ${payload.status || 'pending'}`;
      track('AI Credits Purchased', { package: url.searchParams.get('package') || 'unknown' });
      render();
    } catch (error) {
      elements.purchaseStatus.textContent = error.message;
      elements.purchaseStatus.classList.add('is-error');
    } finally {
      url.searchParams.delete('paypal');
      url.searchParams.delete('package');
      url.searchParams.delete('token');
      url.searchParams.delete('PayerID');
      history.replaceState({}, '', url);
    }
  }

  async function sendQuestion(event) {
    event.preventDefault();
    if (state.sending || !state.user) return;
    const question = elements.question.value.trim();
    if (!question) return;
    if (Number(state.account?.availableBalance || 0) < 0.1) {
      elements.composerHint.textContent = 'Add Credits before asking another question.';
      elements.purchaseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const historyForRequest = state.history.slice(-8);
    addMessage('user', question);
    elements.question.value = '';
    state.sending = true;
    elements.sendButton.disabled = true;
    elements.composerHint.textContent = 'Reading the table…';
    const loading = addLoadingMessage();
    try {
      const clientRequestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const payload = await api('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history: historyForRequest, clientRequestId })
      });
      loading.remove();
      addMessage('assistant', payload.answer, payload.billing);
      if (typeof payload.balance === 'number') {
        state.account.availableBalance = payload.balance;
        state.account.balance = payload.balance;
      }
      elements.composerHint.textContent = payload.billing?.status === 'billed'
        ? `${formatCredits(payload.billing.billedCredits)} Credits deducted for this answer.`
        : payload.billing?.note || 'No Credits deducted.';
      track('AI Question Answered', { billed: payload.billing?.status === 'billed' });
      render();
    } catch (error) {
      loading.remove();
      addMessage('assistant', error.message || 'The advisor is unavailable right now.', { status: 'error', note: 'No Credits charged.' }, false);
      elements.composerHint.textContent = error.payload?.needsTopup ? 'Add Credits to continue.' : 'No Credits charged. Try again in a moment.';
      if (error.payload?.needsTopup) elements.purchaseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      state.sending = false;
      elements.sendButton.disabled = false;
    }
  }

  async function logout() {
    try { await api('/api/ai/auth/logout', { method: 'POST' }); } catch { /* clear UI anyway */ }
    state.user = null;
    state.account = null;
    state.history = [];
    saveHistory();
    location.reload();
  }

  function init() {
    Object.assign(elements, {
      loginGate: byId('aiLoginGate'),
      chat: byId('aiChat'),
      messages: byId('aiMessages'),
      composer: byId('aiComposer'),
      question: byId('aiQuestion'),
      sendButton: byId('aiSendButton'),
      composerHint: byId('aiComposerHint'),
      balance: byId('aiBalance'),
      walletBalance: byId('aiWalletBalance'),
      accountSignedOut: byId('aiAccountSignedOut'),
      accountSignedIn: byId('aiAccountSignedIn'),
      userName: byId('aiUserName'),
      userEmail: byId('aiUserEmail'),
      userPicture: byId('aiUserPicture'),
      logout: byId('aiLogout'),
      googleButton: byId('googleSignInButton'),
      purchaseCard: byId('aiPurchaseCard'),
      purchaseStatus: byId('aiPurchaseStatus'),
      purchaseConsent: byId('aiPurchaseConsent'),
      ledger: byId('aiLedger')
    });
    elements.composer.addEventListener('submit', sendQuestion);
    elements.logout.addEventListener('click', logout);
    elements.purchaseConsent.addEventListener('change', render);
    for (const pack of document.querySelectorAll('.aiPack')) pack.addEventListener('click', () => buyCredits(pack.dataset.package));
    for (const prompt of document.querySelectorAll('[data-prompt]')) prompt.addEventListener('click', () => {
      elements.question.value = prompt.dataset.prompt;
      elements.question.focus();
    });
    for (const entry of state.history) addMessage(entry.role, entry.content, null, false);
    refreshAccount().then(handlePaypalReturn);
    window.initBalatroGoogleSignIn();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
