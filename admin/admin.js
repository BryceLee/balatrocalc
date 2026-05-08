(function () {
  const searchEmail = document.getElementById('searchEmail');
  const searchBtn = document.getElementById('searchBtn');
  const searchResult = document.getElementById('searchResult');

  const paymentEmail = document.getElementById('paymentEmail');
  const paymentPlan = document.getElementById('paymentPlan');
  const paymentAmount = document.getElementById('paymentAmount');
  const paymentTxn = document.getElementById('paymentTxn');
  const paymentBtn = document.getElementById('paymentBtn');
  const paymentStatus = document.getElementById('paymentStatus');

  const revokeEmail = document.getElementById('revokeEmail');
  const revokeBtn = document.getElementById('revokeBtn');
  const revokeStatus = document.getElementById('revokeStatus');

  const analyticsDays = document.getElementById('analyticsDays');
  const analyticsEmail = document.getElementById('analyticsEmail');
  const analyticsRefresh = document.getElementById('analyticsRefresh');
  const analyticsStatus = document.getElementById('analyticsStatus');
  const analyticsOverview = document.getElementById('analyticsOverview');
  const analyticsFunnel = document.getElementById('analyticsFunnel');
  const analyticsDropoffs = document.getElementById('analyticsDropoffs');
  const analyticsPaidUsage = document.getElementById('analyticsPaidUsage');
  const analyticsTimeline = document.getElementById('analyticsTimeline');

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }

  function formatDuration(seconds) {
    const total = Number(seconds || 0);
    if (!Number.isFinite(total) || total <= 0) return '0s';
    const minutes = Math.floor(total / 60);
    const remaining = Math.round(total % 60);
    return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
  }

  async function getJson(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
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
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function renderCountRows(target, rows) {
    target.innerHTML = (rows || []).map((row) => `
      <tr>
        <td>${escapeHtml(row.eventName)}</td>
        <td>${escapeHtml(row.uniqueUsers)}</td>
        <td>${escapeHtml(row.totalEvents)}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" class="muted">No events yet.</td></tr>';
  }

  function renderPaidUsage(rows) {
    analyticsPaidUsage.innerHTML = (rows || []).map((row) => `
      <tr>
        <td>${escapeHtml(row.email)}</td>
        <td>${escapeHtml(formatDateTime(row.lastSeenAt))}</td>
        <td>${escapeHtml(row.totalEvents)}</td>
        <td>${escapeHtml(row.paidAnalyzeCount)}</td>
        <td>${escapeHtml(row.seedCopiedCount)}</td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="muted">No paid activity yet.</td></tr>';
  }

  function renderTimeline(rows) {
    analyticsTimeline.innerHTML = (rows || []).map((row) => `
      <tr>
        <td>${escapeHtml(formatDateTime(row.createdAt))}</td>
        <td>${escapeHtml(row.eventName)}</td>
        <td>${escapeHtml(row.subscriptionStatus)}</td>
        <td>${escapeHtml(row.path)}</td>
        <td><code>${escapeHtml(JSON.stringify(row.properties || {}))}</code></td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="muted">Enter an email and refresh to view a user timeline.</td></tr>';
  }

  async function loadAnalytics() {
    if (!analyticsOverview) return;
    analyticsStatus.textContent = 'Loading analytics...';
    const params = new URLSearchParams();
    params.set('days', analyticsDays.value || '30');
    const email = normalizeEmail(analyticsEmail.value);
    if (email) params.set('email', email);

    try {
      const data = await getJson(`/api/admin/analytics?${params.toString()}`);
      const overview = data.overview || {};
      analyticsOverview.innerHTML = `
        <div class="metric-card"><span>Total events</span><strong>${escapeHtml(overview.totalEvents || 0)}</strong></div>
        <div class="metric-card"><span>Active anonymous users</span><strong>${escapeHtml(overview.activeAnonymousUsers || 0)}</strong></div>
        <div class="metric-card"><span>Active paid emails</span><strong>${escapeHtml(overview.activePaidEmails || 0)}</strong></div>
        <div class="metric-card"><span>Avg paid session</span><strong>${escapeHtml(formatDuration(overview.averagePaidSessionSeconds))}</strong></div>
      `;
      renderCountRows(analyticsFunnel, data.funnel || []);
      renderCountRows(analyticsDropoffs, data.dropoffs || []);
      renderPaidUsage(data.paidUsage || []);
      renderTimeline(data.timeline || []);
      analyticsStatus.textContent = `Showing analytics since ${formatDateTime(data.since)} UTC.`;
    } catch (error) {
      analyticsStatus.textContent = error.message || 'Analytics request failed';
    }
  }

  searchBtn.addEventListener('click', async () => {
    searchResult.textContent = 'Loading...';
    const email = normalizeEmail(searchEmail.value);
    if (!email) {
      searchResult.textContent = 'Missing email';
      return;
    }
    try {
      const data = await getJson(`/api/admin/search?email=${encodeURIComponent(email)}`);
      searchResult.textContent = JSON.stringify(data.results || [], null, 2);
    } catch (error) {
      searchResult.textContent = error.message || 'Search failed';
    }
  });

  paymentBtn.addEventListener('click', async () => {
    paymentStatus.textContent = '';
    const email = normalizeEmail(paymentEmail.value);
    const plan = paymentPlan.value;
    const amount = paymentAmount.value;
    const txnId = paymentTxn.value;
    if (!email) {
      paymentStatus.textContent = 'Missing email';
      return;
    }
    try {
      const data = await postJson('/api/admin/payment', {
        email,
        plan,
        amount,
        txn_id: txnId
      });
      paymentStatus.textContent = `Added payment. Expires: ${data.expiresAt || 'lifetime'}`;
    } catch (error) {
      paymentStatus.textContent = error.message || 'Payment add failed';
    }
  });

  revokeBtn.addEventListener('click', async () => {
    revokeStatus.textContent = '';
    const email = normalizeEmail(revokeEmail.value);
    if (!email) {
      revokeStatus.textContent = 'Missing email';
      return;
    }
    try {
      await postJson('/api/admin/revoke', { email });
      revokeStatus.textContent = 'Revoked active memberships';
    } catch (error) {
      revokeStatus.textContent = error.message || 'Revoke failed';
    }
  });

  analyticsRefresh.addEventListener('click', loadAnalytics);
  analyticsDays.addEventListener('change', loadAnalytics);
  analyticsEmail.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      loadAnalytics();
    }
  });
  loadAnalytics();
})();
