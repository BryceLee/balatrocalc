(function () {
  'use strict';

  const GOOGLE_CLIENT_ID = '286347292359-g93pq2e1d7msio01rgt01ojed37es37v.apps.googleusercontent.com';
  const state = {
    user: null,
    account: null,
    sending: false,
    buying: false,
    googleInitialized: false,
    conversations: [],
    currentConversationId: null,
    historyOpen: false,
    loadingConversation: false
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
      charged.textContent = billing.status === 'billed' || Number(billing.billedCredits || 0) > 0
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

  function addMessage(role, content, billing) {
    const node = messageElement(role, content, billing);
    elements.messages.append(node);
    elements.messages.scrollTop = elements.messages.scrollHeight;
    return node;
  }

  function addWelcomeMessage() {
    const article = document.createElement('article');
    article.className = 'aiMessage aiMessage--assistant';
    const role = document.createElement('div');
    role.className = 'aiMessageRole';
    role.textContent = 'JOKER ADVISOR';
    const copy = document.createElement('p');
    copy.textContent = 'Show me your Jokers, describe the Ante and your main hand, or ask why a build is stalling. I’ll help you find the missing role.';
    const chips = document.createElement('div');
    chips.className = 'aiPromptChips';
    chips.setAttribute('aria-label', 'Example questions');
    const examples = [
      ['Blueprint order', 'I have Blueprint, Photograph, and Hanging Chad. What order should I use and why?'],
      ['Missing role', 'How do I know whether my build needs Chips, +Mult, or XMult?'],
      ['When to pivot', 'When should I pivot away from a Flush build?']
    ];
    for (const [label, prompt] of examples) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        elements.question.value = prompt;
        elements.question.focus();
      });
      chips.append(button);
    }
    article.append(role, copy, chips);
    elements.messages.append(article);
  }

  function resetConversationView() {
    elements.messages.replaceChildren();
    addWelcomeMessage();
    elements.conversationTitle.textContent = 'New conversation';
    elements.composerHint.textContent = 'Cost depends on model, input/output tokens, and conversation length.';
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

  function renderConversationHistory() {
    elements.historyList.replaceChildren();
    elements.historyCount.textContent = String(state.conversations.length);
    elements.historyPanel.hidden = !state.historyOpen;
    elements.toggleHistory.setAttribute('aria-expanded', String(state.historyOpen));
    if (!state.conversations.length) {
      const empty = document.createElement('p');
      empty.className = 'aiHistoryEmpty';
      empty.textContent = 'No saved tables yet. Your first successful answer will appear here.';
      elements.historyList.append(empty);
      return;
    }
    state.conversations.forEach((conversation, index) => {
      const item = document.createElement('div');
      item.className = 'aiHistoryItem';
      if (conversation.id === state.currentConversationId) item.classList.add('is-active');
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'aiHistoryOpen';
      open.setAttribute('aria-label', `Open ${conversation.title}`);
      const marker = document.createElement('span');
      marker.className = 'aiHistoryIndex';
      marker.textContent = String(index + 1).padStart(2, '0');
      const copy = document.createElement('span');
      copy.className = 'aiHistoryCopy';
      const title = document.createElement('strong');
      title.textContent = conversation.title;
      const meta = document.createElement('small');
      meta.textContent = `${conversation.messageCount} messages · ${formatDate(conversation.updatedAt)}`;
      copy.append(title, meta);
      const arrow = document.createElement('span');
      arrow.className = 'aiHistoryMeta';
      arrow.textContent = conversation.id === state.currentConversationId ? 'OPEN' : '↗';
      open.append(marker, copy, arrow);
      open.addEventListener('click', () => openConversation(conversation.id));

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'aiHistoryDelete';
      remove.textContent = '×';
      remove.title = 'Delete conversation';
      remove.setAttribute('aria-label', `Delete ${conversation.title}`);
      remove.addEventListener('click', () => deleteConversation(conversation));
      item.append(open, remove);
      elements.historyList.append(item);
    });
  }

  function setHistoryOpen(open) {
    state.historyOpen = Boolean(open);
    renderConversationHistory();
  }

  async function refreshConversations(openLatest = false) {
    if (!state.user) return;
    try {
      const payload = await api('/api/ai/conversations');
      state.conversations = Array.isArray(payload.conversations) ? payload.conversations : [];
      renderConversationHistory();
      if (openLatest && state.conversations.length) {
        await openConversation(state.conversations[0].id, false);
      } else if (openLatest) {
        startNewConversation();
      }
    } catch (error) {
      console.warn(error);
      elements.composerHint.textContent = 'Saved conversations could not be loaded. Try refreshing the page.';
    }
  }

  async function openConversation(conversationId, closeHistory = true) {
    if (state.loadingConversation || state.sending) return;
    state.loadingConversation = true;
    elements.messages.setAttribute('aria-busy', 'true');
    try {
      const payload = await api(`/api/ai/conversations/${encodeURIComponent(conversationId)}`);
      const conversation = payload.conversation;
      state.currentConversationId = conversation.id;
      elements.conversationTitle.textContent = conversation.title;
      elements.messages.replaceChildren();
      for (const message of conversation.messages || []) {
        addMessage(message.role, message.content, message.billing);
      }
      if (!(conversation.messages || []).length) addWelcomeMessage();
      renderConversationHistory();
      if (closeHistory) setHistoryOpen(false);
      track('AI Conversation Opened');
    } catch (error) {
      elements.composerHint.textContent = error.message;
    } finally {
      state.loadingConversation = false;
      elements.messages.removeAttribute('aria-busy');
    }
  }

  function startNewConversation() {
    if (state.sending) return;
    state.currentConversationId = null;
    resetConversationView();
    setHistoryOpen(false);
    renderConversationHistory();
    elements.question.focus();
    track('AI Conversation Started');
  }

  async function deleteConversation(conversation) {
    if (!window.confirm(`Permanently delete “${conversation.title}”? This cannot be undone.`)) return;
    try {
      await api(`/api/ai/conversations/${encodeURIComponent(conversation.id)}`, { method: 'DELETE' });
      state.conversations = state.conversations.filter((entry) => entry.id !== conversation.id);
      if (state.currentConversationId === conversation.id) {
        state.currentConversationId = null;
        resetConversationView();
      }
      renderConversationHistory();
      track('AI Conversation Deleted');
    } catch (error) {
      elements.composerHint.textContent = error.message;
    }
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
    renderConversationHistory();
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
    if (state.user) await refreshConversations(true);
    else window.initBalatroGoogleSignIn();
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
      await refreshConversations(true);
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
        body: JSON.stringify({
          message: question,
          conversationId: state.currentConversationId,
          clientRequestId
        })
      });
      loading.remove();
      addMessage('assistant', payload.answer, payload.billing);
      if (payload.conversation) {
        state.currentConversationId = payload.conversation.id;
        elements.conversationTitle.textContent = payload.conversation.title;
        await refreshConversations(false);
      }
      if (typeof payload.balance === 'number') {
        state.account.availableBalance = payload.balance;
        state.account.balance = payload.balance;
      }
      if (!payload.historySaved) {
        elements.composerHint.textContent = 'Answer delivered, but chat history could not be saved. Billing is still recorded.';
      } else {
        elements.composerHint.textContent = payload.billing?.status === 'billed'
          ? `${formatCredits(payload.billing.billedCredits)} Credits deducted · conversation saved.`
          : `${payload.billing?.note || 'No Credits deducted.'} Conversation saved.`;
      }
      track('AI Question Answered', { billed: payload.billing?.status === 'billed' });
      render();
    } catch (error) {
      loading.remove();
      addMessage('assistant', error.message || 'The advisor is unavailable right now.', { status: 'error', note: 'No Credits charged.' });
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
    state.conversations = [];
    state.currentConversationId = null;
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
      ledger: byId('aiLedger'),
      conversationTitle: byId('aiConversationTitle'),
      newConversation: byId('aiNewConversation'),
      toggleHistory: byId('aiToggleHistory'),
      historyCount: byId('aiHistoryCount'),
      historyPanel: byId('aiHistoryPanel'),
      historyList: byId('aiHistoryList'),
      closeHistory: byId('aiCloseHistory')
    });
    elements.composer.addEventListener('submit', sendQuestion);
    elements.logout.addEventListener('click', logout);
    elements.newConversation.addEventListener('click', startNewConversation);
    elements.toggleHistory.addEventListener('click', () => setHistoryOpen(!state.historyOpen));
    elements.closeHistory.addEventListener('click', () => setHistoryOpen(false));
    elements.purchaseConsent.addEventListener('change', render);
    for (const pack of document.querySelectorAll('.aiPack')) pack.addEventListener('click', () => buyCredits(pack.dataset.package));
    for (const prompt of document.querySelectorAll('[data-prompt]')) prompt.addEventListener('click', () => {
      elements.question.value = prompt.dataset.prompt;
      elements.question.focus();
    });
    refreshAccount().then(handlePaypalReturn);
    window.initBalatroGoogleSignIn();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
