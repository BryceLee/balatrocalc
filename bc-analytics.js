// First-party behavior analytics for balatrocalc.
// Injected into every public HTML page by functions/_middleware.js.
// Sends pseudonymous events (no IP, no PII) to /api/events, which stores them in D1.
(function () {
  if (window.bcAnalytics) return;

  var ENDPOINT = '/api/events';
  // Shared with seed-analyzer-access.js so paid-seed events and sitewide events line up.
  var DEVICE_KEY = 'bc_device_id';
  var SESSION_KEY = 'bc_session_id';
  var SESSION_SEEN_KEY = 'bc_session_seen_at';
  var SESSION_IDLE_MS = 30 * 60 * 1000;
  var LANGS = ['ar', 'cn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ko',
    'ms', 'nl', 'no', 'pl', 'pt-br', 'pt-pt', 'ro', 'ru', 'sv', 'th', 'tl', 'tr', 'tw', 'uk', 'vi'];
  var DOWNLOAD_EXT = /\.(apk|zip|7z|rar|exe|dmg|jkr|lua|json|txt|pdf|png|jpg)(?:$|[?#])/i;

  var disabled = false;
  try {
    disabled = navigator.globalPrivacyControl === true ||
      /bot|crawler|spider|headless|lighthouse|prerender/i.test(navigator.userAgent || '') ||
      navigator.webdriver === true;
  } catch (e) { /* ignore */ }

  var memory = {};
  function read(area, key) {
    try { var v = window[area].getItem(key); if (v !== null) return v; } catch (e) { /* fall through */ }
    return memory[area + key] || null;
  }
  function write(area, key, value) {
    try { window[area].setItem(key, value); return; } catch (e) { /* fall through */ }
    memory[area + key] = value;
  }
  function rid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
  }

  var newUser = false;
  var deviceId = read('localStorage', DEVICE_KEY);
  if (!deviceId) {
    deviceId = rid('dev');
    newUser = true;
    write('localStorage', DEVICE_KEY, deviceId);
  }

  // A session ends after 30 minutes idle or when the tab is closed.
  var entry = false;
  var sessionId = read('sessionStorage', SESSION_KEY);
  var lastSeen = Number(read('sessionStorage', SESSION_SEEN_KEY) || 0);
  if (!sessionId || (lastSeen && Date.now() - lastSeen > SESSION_IDLE_MS)) {
    sessionId = rid('sess');
    entry = true;
    write('sessionStorage', SESSION_KEY, sessionId);
  }
  function touchSession() { write('sessionStorage', SESSION_SEEN_KEY, String(Date.now())); }
  touchSession();

  var path = location.pathname;
  var lang = (function () {
    var first = path.split('/')[1] || '';
    return LANGS.indexOf(first.toLowerCase()) >= 0 ? first.toLowerCase() : 'en';
  })();
  var pageViewId = rid('pv');

  function paidEmail() {
    try {
      var email = read('localStorage', 'bc_paid_email');
      return email ? String(email).trim().toLowerCase() : null;
    } catch (e) { return null; }
  }
  function paidStatus() {
    try {
      var raw = read('localStorage', 'bc_paid_features');
      if (!raw) return 'free';
      var parsed = JSON.parse(raw);
      var now = Date.now();
      for (var key in parsed) {
        var entryValue = parsed[key];
        if (!entryValue || !entryValue.plan) continue;
        if (/-lifetime$/.test(entryValue.plan)) return 'paid';
        if (entryValue.expiresAt && new Date(entryValue.expiresAt).getTime() > now) return 'paid';
      }
    } catch (e) { /* ignore */ }
    return 'free';
  }

  function send(events, useBeacon) {
    if (disabled || !events.length) return;
    try {
      var body = JSON.stringify({ events: events });
      if (useBeacon && navigator.sendBeacon) {
        if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))) return;
      }
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* analytics must never break the page */ }
  }

  var queue = [];
  var flushTimer = null;
  function build(name, props) {
    var base = { pv: pageViewId, lang: lang };
    if (props) for (var k in props) base[k] = props[k];
    return {
      eventName: name,
      anonymousId: deviceId,
      sessionId: sessionId,
      email: paidEmail(),
      subscriptionStatus: paidStatus(),
      path: path,
      referrer: document.referrer || '',
      properties: base
    };
  }
  function flush(useBeacon) {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    var batch = queue.splice(0, 20);
    send(batch, useBeacon);
    if (queue.length) flush(useBeacon);
  }
  function track(name, props) {
    if (disabled || !name) return;
    touchSession();
    queue.push(build(String(name), props));
    if (queue.length >= 10) flush(false);
    else if (!flushTimer) flushTimer = setTimeout(function () { flush(false); }, 1500);
  }

  // ---- engagement: visible time, scroll depth, per-page counters ----
  var interacted = false;
  var visibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
  var engagedMs = 0;
  var maxScroll = 0;
  var counters = {};
  var onceSent = {};
  var lastSentSignature = '';

  function currentEngaged() {
    return engagedMs + (visibleSince ? Date.now() - visibleSince : 0);
  }
  function updateScroll() {
    var doc = document.documentElement;
    var height = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0) - window.innerHeight;
    var pct = height <= 0 ? 100 : Math.round((window.scrollY / height) * 100);
    if (pct > maxScroll) maxScroll = Math.min(100, pct);
  }
  function sendEngagement() {
    var ms = currentEngaged();
    if (ms < 1000) return;
    var props = { engaged_ms: Math.min(ms, 6 * 60 * 60 * 1000), scroll_pct: maxScroll, interacted: interacted };
    for (var key in counters) props['n_' + key] = counters[key];
    var signature = JSON.stringify(props);
    if (signature === lastSentSignature) return;
    lastSentSignature = signature;
    queue.push(build('page_engagement', props));
    flush(true);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      if (visibleSince) { engagedMs += Date.now() - visibleSince; visibleSince = 0; }
      sendEngagement();
    } else {
      visibleSince = Date.now();
      touchSession();
    }
  });
  window.addEventListener('pagehide', function () {
    if (visibleSince) { engagedMs += Date.now() - visibleSince; visibleSince = 0; }
    sendEngagement();
  });
  window.addEventListener('scroll', updateScroll, { passive: true });
  ['pointerdown', 'keydown'].forEach(function (type) {
    window.addEventListener(type, function () { interacted = true; }, { capture: true, passive: true });
  });

  // ---- automatic action capture ----
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target : null;
    if (!target) return;
    var tagged = target.closest('[data-bc-track]');
    if (tagged) {
      track('ui_click', { id: tagged.getAttribute('data-bc-track') });
    }
    var link = target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var url;
    try { url = new URL(href, location.href); } catch (e) { return; }
    if (link.hasAttribute('download') || DOWNLOAD_EXT.test(url.pathname)) {
      track('file_download', { file: url.pathname.split('/').pop().slice(0, 120), host: url.host === location.host ? '' : url.host });
    } else if (url.protocol.indexOf('http') === 0 && url.host !== location.host) {
      track('outbound_click', { host: url.host, href: (url.host + url.pathname).slice(0, 200) });
    }
  }, true);

  document.addEventListener('change', function (event) {
    var input = event.target;
    if (!input || input.tagName !== 'INPUT' || input.type !== 'file' || !input.files || !input.files[0]) return;
    var file = input.files[0];
    var ext = (file.name.split('.').pop() || '').toLowerCase().slice(0, 12);
    track('file_upload', { ext: ext, size_kb: Math.round(file.size / 1024), input: (input.id || '').slice(0, 60) });
  }, true);

  document.addEventListener('copy', function () {
    if (!onceSent.copy) { onceSent.copy = true; track('text_copied', {}); }
  });

  // ---- page view ----
  var params = new URLSearchParams(location.search);
  var refHost = '';
  try { refHost = document.referrer ? new URL(document.referrer).host : ''; } catch (e) { /* ignore */ }
  var viewProps = {
    title: (document.title || '').slice(0, 120),
    entry: entry,
    new_user: newUser,
    ref_host: refHost === location.host ? '' : refHost,
    device: window.matchMedia && window.matchMedia('(pointer: coarse)').matches
      ? (Math.min(screen.width, screen.height) >= 600 ? 'tablet' : 'mobile') : 'desktop',
    screen_w: window.innerWidth || 0,
    browser_lang: (navigator.language || '').slice(0, 16)
  };
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
    var value = params.get(key);
    if (value) viewProps[key] = value.slice(0, 80);
  });
  if (params.has('hand') || /[?&#]h=/.test(location.href)) viewProps.shared_link = true;
  track('page_view', viewProps);

  window.bcAnalytics = {
    deviceId: deviceId,
    sessionId: sessionId,
    track: track,
    // Count a user action on this page; the first one per page view also emits an event.
    // Ignored until the visitor has interacted, so URL-restored state does not count.
    action: function (name, props) {
      if (!interacted) return;
      counters[name] = (counters[name] || 0) + 1;
      if (!onceSent[name]) {
        onceSent[name] = true;
        track(name, props);
      }
    },
    flush: function () { flush(true); }
  };
})();
