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
    return minutes ? `${minutes}分 ${remaining}秒` : `${remaining}秒`;
  }

  async function getJson(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '请求失败');
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
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }

  function renderCountRows(target, rows) {
    target.innerHTML = (rows || []).map((row) => `
      <tr>
        <td>${escapeHtml(row.eventName)}</td>
        <td>${escapeHtml(row.uniqueUsers)}</td>
        <td>${escapeHtml(row.totalEvents)}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" class="muted">暂无事件。</td></tr>';
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
    `).join('') || '<tr><td colspan="5" class="muted">暂无付费用户行为。</td></tr>';
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
    `).join('') || '<tr><td colspan="5" class="muted">输入邮箱并刷新，可查看该用户的行为时间线。</td></tr>';
  }

  async function loadAnalytics() {
    if (!analyticsOverview) return;
    analyticsStatus.textContent = '正在加载行为数据...';
    const params = new URLSearchParams();
    params.set('days', analyticsDays.value || '30');
    const email = normalizeEmail(analyticsEmail.value);
    if (email) params.set('email', email);

    try {
      const data = await getJson(`/api/admin/analytics?${params.toString()}`);
      const overview = data.overview || {};
      analyticsOverview.innerHTML = `
        <div class="metric-card"><span>总事件数</span><strong>${escapeHtml(overview.totalEvents || 0)}</strong></div>
        <div class="metric-card"><span>活跃匿名用户</span><strong>${escapeHtml(overview.activeAnonymousUsers || 0)}</strong></div>
        <div class="metric-card"><span>活跃付费邮箱</span><strong>${escapeHtml(overview.activePaidEmails || 0)}</strong></div>
        <div class="metric-card"><span>平均付费会话</span><strong>${escapeHtml(formatDuration(overview.averagePaidSessionSeconds))}</strong></div>
      `;
      renderCountRows(analyticsFunnel, data.funnel || []);
      renderCountRows(analyticsDropoffs, data.dropoffs || []);
      renderPaidUsage(data.paidUsage || []);
      renderTimeline(data.timeline || []);
      analyticsStatus.textContent = `当前展示 ${formatDateTime(data.since)} UTC 以来的数据。`;
    } catch (error) {
      analyticsStatus.textContent = error.message || '行为数据请求失败';
    }
  }

  searchBtn.addEventListener('click', async () => {
    searchResult.textContent = '正在查询...';
    const email = normalizeEmail(searchEmail.value);
    if (!email) {
      searchResult.textContent = '缺少邮箱';
      return;
    }
    try {
      const data = await getJson(`/api/admin/search?email=${encodeURIComponent(email)}`);
      searchResult.textContent = JSON.stringify(data.results || [], null, 2);
    } catch (error) {
      searchResult.textContent = error.message || '查询失败';
    }
  });

  paymentBtn.addEventListener('click', async () => {
    paymentStatus.textContent = '';
    const email = normalizeEmail(paymentEmail.value);
    const plan = paymentPlan.value;
    const amount = paymentAmount.value;
    const txnId = paymentTxn.value;
    if (!email) {
      paymentStatus.textContent = '缺少邮箱';
      return;
    }
    try {
      const data = await postJson('/api/admin/payment', {
        email,
        plan,
        amount,
        txn_id: txnId
      });
      paymentStatus.textContent = `已添加付款。到期时间：${data.expiresAt || '终身'}`;
    } catch (error) {
      paymentStatus.textContent = error.message || '添加付款失败';
    }
  });

  revokeBtn.addEventListener('click', async () => {
    revokeStatus.textContent = '';
    const email = normalizeEmail(revokeEmail.value);
    if (!email) {
      revokeStatus.textContent = '缺少邮箱';
      return;
    }
    try {
      await postJson('/api/admin/revoke', { email });
      revokeStatus.textContent = '已撤销该邮箱的有效会员';
    } catch (error) {
      revokeStatus.textContent = error.message || '撤销失败';
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
