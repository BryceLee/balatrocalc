(function () {
  const granularity = document.getElementById('behaviorGranularity');
  const refresh = document.getElementById('behaviorRefresh');
  const status = document.getElementById('behaviorStatus');
  if (!granularity || !refresh) return;

  const FEATURE_LABELS = {
    calculator: '分数计算器',
    'save-editor': '存档编辑器',
    'seed-analyzer': '种子分析器',
    seeds: '种子库',
    seed: '种子付费墙',
    jokers: '小丑牌图鉴',
    builds: '流派攻略',
    deck: '牌组',
    'hand-levels': '牌型等级',
    'max-hand-size': '最大手牌',
    'mod-manager': 'Mod 管理器',
    'mod-install-guide': 'Mod 安装教程',
    'save-locations': '存档位置',
    'code-dbd': 'DBD 兑换码',
    'ai-assistant': 'AI 顾问',
    'high-card-build': '高牌流',
    apk: 'APK 下载',
    blog: '博客',
    guide: '指南',
    info: '关于/条款等'
  };

  const ACTION_LABELS = {
    page_view: '页面浏览',
    outbound_click: '点击外链',
    file_download: '下载文件',
    file_upload: '上传文件',
    text_copied: '复制文字',
    ui_click: '点击按钮',
    calc_joker_added: '计算器：添加小丑',
    calc_card_added: '计算器：添加卡牌',
    save_file_loaded: '存档：载入成功',
    save_file_failed: '存档：载入失败',
    save_edited: '存档：编辑',
    save_downloaded: '存档：下载修改后存档',
    seed_analyze_started: '种子：开始分析',
    free_limit_reached: '种子：免费次数用完',
    paywall_viewed: '付费墙曝光',
    checkout_started: '开始结账',
    payment_success: '付款成功',
    seed_copied: '复制种子',
    ai_question_answered: 'AI：回答问题',
    ai_checkout_started: 'AI：开始购买',
    ai_credits_purchased: 'AI：购买额度'
  };

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const num = (value) => Number(value || 0).toLocaleString('en-US');
  const feature = (key) => FEATURE_LABELS[key] ? `${FEATURE_LABELS[key]} <span class="muted">${esc(key)}</span>` : esc(key);
  const action = (key) => ACTION_LABELS[key] ? `${ACTION_LABELS[key]} <span class="muted">${esc(key)}</span>` : esc(key);
  const seconds = (value) => {
    const s = Number(value || 0);
    return s >= 60 ? `${Math.floor(s / 60)}分${Math.round(s % 60)}秒` : `${Math.round(s)}秒`;
  };
  const bar = (value, max, alt) => `<div class="bar${alt ? ' alt' : ''}" style="width:${max ? Math.max(2, Math.round((value / max) * 100)) : 0}%"></div>`;

  function rows(id, items, render, cols) {
    document.getElementById(id).innerHTML = items && items.length
      ? items.map(render).join('')
      : `<tr><td colspan="${cols}" class="muted">暂无数据。</td></tr>`;
  }

  function render(data) {
    const s = data.summary || {};
    const returnRate = s.users ? Math.round((s.returningUsers / s.users) * 100) : 0;
    document.getElementById('behaviorSummary').innerHTML = [
      ['用户', num(s.users)],
      ['新用户', num(s.newUsers)],
      ['回访用户（≥2 天）', `${num(s.returningUsers)} <small class="muted">${returnRate}%</small>`],
      ['会话', num(s.sessions)],
      ['浏览量', num(s.pageViews)],
      ['人均浏览', s.users ? (s.pageViews / s.users).toFixed(1) : '0']
    ].map(([label, value]) => `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`).join('');

    const trend = (data.trend || []).slice().reverse();
    const maxUsers = Math.max(0, ...trend.map((row) => row.users || 0));
    rows('behaviorTrend', trend, (row) => `<tr>
      <td>${esc(row.period)}</td><td>${num(row.users)}</td><td class="bar-cell">${bar(row.users, maxUsers)}</td>
      <td>${num(row.new_users)}</td><td>${num(row.sessions)}</td><td>${num(row.page_views)}</td><td>${num(row.paid_users)}</td>
    </tr>`, 7);

    const paid = Object.fromEntries((data.paidByFeature || []).map((row) => [row.feature, row.paid_users]));
    rows('behaviorFeatures', data.features, (row) => {
      const hot = row.users >= 20 && row.repeatRate >= 25 && row.avgEngagedSeconds >= 60;
      return `<tr>
        <td>${feature(row.feature)} ${hot ? '<span class="tag">高价值</span>' : ''}</td>
        <td>${num(row.users)}</td><td>${num(row.pageViews)}</td><td>${num(row.repeatUsers)}</td><td>${row.repeatRate}%</td>
        <td>${seconds(row.avgEngagedSeconds)}</td><td>${num(row.viewsOver1Min)}</td><td>${row.avgScrollPct}%</td><td>${num(paid[row.feature])}</td>
      </tr>`;
    }, 9);

    rows('behaviorActions', data.actions, (row) => `<tr><td>${action(row.event_name)}</td><td>${num(row.unique_users)}</td><td>${num(row.total_events)}</td></tr>`, 3);

    const maxFreq = Math.max(0, ...(data.frequency || []).map((row) => row.users));
    rows('behaviorFrequency', data.frequency, (row) => `<tr><td>${esc(row.bucket)} 天</td><td>${num(row.users)}</td><td class="bar-cell">${bar(row.users, maxFreq, true)}</td></tr>`, 3);

    rows('behaviorActionsByFeature', data.actionsByFeature, (row) => `<tr><td>${feature(row.feature)}</td><td>${action(row.event_name)}</td><td>${num(row.unique_users)}</td><td>${num(row.total_events)}</td></tr>`, 4);
    rows('behaviorSources', data.sources, (row) => `<tr><td>${esc(row.source)}</td><td>${num(row.sessions)}</td><td>${num(row.users)}</td></tr>`, 3);
    rows('behaviorLanding', data.landing, (row) => `<tr><td>${esc(row.path)}</td><td>${num(row.sessions)}</td><td>${num(row.users)}</td></tr>`, 3);
    rows('behaviorCountries', data.countries, (row) => `<tr><td>${esc(row.country)}</td><td>${num(row.users)}</td></tr>`, 2);
    rows('behaviorDevices', data.devices, (row) => `<tr><td>${esc(row.device)}</td><td>${num(row.users)}</td></tr>`, 2);
    rows('behaviorLanguages', data.languages, (row) => `<tr><td>${esc(row.lang)}</td><td>${num(row.users)}</td></tr>`, 2);
  }

  async function load() {
    status.textContent = '正在加载...';
    try {
      const res = await fetch(`/api/admin/behavior?granularity=${encodeURIComponent(granularity.value)}`, { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '请求失败');
      render(data);
      status.textContent = `${data.since.slice(0, 10)} 至今（${data.timezone}）`;
    } catch (error) {
      status.textContent = error.message || '请求失败';
    }
  }

  refresh.addEventListener('click', load);
  granularity.addEventListener('change', load);
  load();
})();
