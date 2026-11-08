(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = { preparing: '准备照片', submitting: '提交中', queued: '排队中', generating: '生成中', saving: '正在保存', completed: '已完成', failed: '未完成', uncertain: '提交待核实' };
  const activeStates = new Set(['preparing', 'submitting', 'queued', 'generating', 'saving', 'uncertain']);
  const recoverStates = new Set(['preparing', 'submitting', 'uncertain']);
  let jobs = [], selected = null, photo = null, previewURL = null, ready = false, busy = false, preparing = false, timer, photoVersion = 0, loading = false;
  let submissionKey;
  try { submissionKey = sessionStorage.getItem('ai-video-submission'); } catch { /* Session persistence is optional. */ }
  const status = message => { $('formStatus').textContent = message; };
  function persistKey(value) {
    submissionKey = value;
    try { if (value) sessionStorage.setItem('ai-video-submission', value); else sessionStorage.removeItem('ai-video-submission'); } catch { /* Private browsing may disable storage. */ }
  }
  async function api(path, options = {}) {
    const response = await fetch(`${window.location.origin}/api/admin/video/${path}`, {
      credentials: 'same-origin', cache: 'no-store', ...options,
      headers: { 'Content-Type': 'application/json', 'X-AI-Video': '1', ...options.headers }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 ? '管理员登录已失效，请重新进入管理后台。' : result.error || '请求失败，请稍后刷新。');
    return result;
  }
  function updateButton() {
    const active = jobs.find(job => activeStates.has(job.status));
    $('generate').disabled = !ready || busy || preparing || !photo || !$('consent').checked || Boolean(active);
    $('generate').firstChild.textContent = busy ? '正在提交… ' : active ? '请先完成当前任务 ' : submissionKey ? '重查本次提交 ' : '生成视频 ';
  }
  async function preparePhoto(file) {
    if (!file) return;
    const version = ++photoVersion;
    photo = null; preparing = true; updateButton();
    $('photoStatus').textContent = '正在准备照片…';
    let bitmap;
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0) throw new Error('请选择 10 MB 以内的 JPG、PNG 或 WebP 图片。');
      bitmap = await createImageBitmap(file);
      if (version !== photoVersion) return;
      const { width, height } = bitmap;
      if (Math.min(width, height) < 240 || Math.max(width, height) / Math.min(width, height) > 6) throw new Error('请使用短边至少 240 像素的照片，避免过长或过宽的图片。');
      const scale = Math.min(1, 1600 / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      photo = canvas.toDataURL('image/jpeg', .88);
      if (photo.length > 2.7 * 1024 * 1024) photo = canvas.toDataURL('image/jpeg', .7);
      if (photo.length > 2.7 * 1024 * 1024) throw new Error('照片压缩后仍过大，请换一张照片。');
      if (previewURL) URL.revokeObjectURL(previewURL);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .88));
      if (version !== photoVersion) return;
      previewURL = URL.createObjectURL(blob);
      $('photoPreview').src = previewURL; $('photoPreview').hidden = false;
      $('uploadText').hidden = true; $('replacePhoto').hidden = false;
      $('photoStatus').textContent = `已准备 ${canvas.width} × ${canvas.height} 照片，上传时会移除原始文件的附加信息。`;
      status('');
    } catch (error) {
      if (version !== photoVersion) return;
      photo = null; $('photoPreview').hidden = true; $('uploadText').hidden = false; $('replacePhoto').hidden = true;
      $('photoStatus').textContent = error.message;
    } finally {
      bitmap?.close();
      if (version === photoVersion) { preparing = false; updateButton(); }
    }
  }
  function selectJob(job) {
    selected = job;
    $('emptyStage').hidden = true; $('jobStage').hidden = false;
    $('outputBadge').textContent = labels[job.status] || job.status;
    $('jobSettings').textContent = `${job.scene === 'rap' ? '小丑说唱' : '小丑舞步'} · ${job.duration} 秒 · ${job.resolution.toLowerCase()} · ${job.aspectRatio}`;
    $('jobId').textContent = `任务 ${job.id}`; $('jobError').textContent = job.error || '';
    const complete = job.status === 'completed';
    $('resultVideo').hidden = !complete; $('jobProgress').hidden = complete; $('downloadVideo').hidden = !complete;
    if (complete) {
      if ($('resultVideo').getAttribute('src') !== job.videoURL) { $('resultVideo').src = job.videoURL; $('resultVideo').poster = job.photoURL; }
      $('downloadVideo').href = `${job.videoURL}?download=1`;
    } else {
      $('resultVideo').pause(); $('resultVideo').removeAttribute('src'); $('resultVideo').load();
      $('progressTitle').textContent = labels[job.status] || '等待状态';
      $('progressDescription').textContent = job.status === 'uncertain' ? '请先在生成服务后台核实任务。为避免重复扣费，当前不会再次提交。' : job.status === 'failed' ? '这次任务未完成，你可以查看错误说明、调整后重新提交。' : '生成通常需要几分钟，可离开此页，稍后回到记录中继续查询。';
    }
    $('refreshJob').hidden = !activeStates.has(job.status);
    $('recovery').hidden = !recoverStates.has(job.status);
    $('confirmNoTask').checked = false; $('releaseTask').disabled = true; $('providerId').value = '';
    updateButton();
  }
  function renderHistory() {
    const list = $('historyList'); list.replaceChildren();
    $('historyStatus').textContent = jobs.length ? '最近 30 条记录 · 点击查看；进行中的任务会自动查询。' : '还没有视频记录。你的第一次演出，从一张照片开始。';
    for (const job of jobs) {
      const card = document.createElement('div'); card.className = 'history-item';
      const img = document.createElement('img'); img.src = job.photoURL; img.alt = '生成参考照片'; img.loading = 'lazy'; img.addEventListener('error', () => { img.hidden = true; });
      const info = document.createElement('div'), title = document.createElement('strong'), meta = document.createElement('p'), view = document.createElement('button');
      title.textContent = `${job.scene === 'rap' ? '小丑说唱' : '小丑舞步'} · ${labels[job.status] || job.status}`;
      meta.textContent = `${new Date(job.createdAt).toLocaleString('zh-CN')} · ${job.duration}s · ${job.aspectRatio}`;
      view.type = 'button'; view.textContent = '查看'; view.addEventListener('click', () => { selectJob(job); if (window.innerWidth < 900) $('outputHeading').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      info.append(title, meta, view);
      if (!activeStates.has(job.status)) {
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '删除';
        remove.addEventListener('click', async () => {
          if (!window.confirm('删除这条记录及其私有照片和视频？此操作无法撤销。')) return;
          remove.disabled = true;
          try {
            await api(`jobs/${job.id}`, { method: 'DELETE' });
            if (selected?.id === job.id) { selected = null; $('resultVideo').pause(); $('resultVideo').removeAttribute('src'); $('resultVideo').load(); $('jobStage').hidden = true; $('emptyStage').hidden = false; }
            await loadJobs();
          } catch (error) { status(error.message); remove.disabled = false; }
        });
        info.append(remove);
      }
      card.append(img, info); list.append(card);
    }
    updateButton();
  }
  async function loadJobs() {
    const result = await api('jobs'); jobs = result.jobs;
    renderHistory();
    if (selected) { const current = jobs.find(job => job.id === selected.id); if (current) selectJob(current); }
    else if (jobs.length) selectJob(jobs.find(job => activeStates.has(job.status)) || jobs[0]);
  }
  async function refreshAll() {
    if (loading || busy || document.hidden) return;
    loading = true; $('refreshHistory').disabled = true; $('refreshJob').disabled = true;
    try {
      for (const job of jobs.filter(job => activeStates.has(job.status) && !recoverStates.has(job.status))) await api(`jobs/${job.id}/refresh`, { method: 'POST' });
      await loadJobs();
    } catch (error) { $('historyStatus').textContent = error.message; }
    finally { loading = false; $('refreshHistory').disabled = false; $('refreshJob').disabled = false; }
  }
  $('studioForm').addEventListener('submit', async event => {
    event.preventDefault();
    if ($('generate').disabled) return;
    busy = true; clearTimeout(timer); updateButton(); status('正在提交，请稍候…');
    if (!submissionKey) persistKey(crypto.randomUUID());
    try {
      const result = await api('jobs', { method: 'POST', body: JSON.stringify({
        photo, scene: new FormData($('studioForm')).get('scene'), duration: Number($('duration').value), resolution: $('resolution').value, aspectRatio: $('aspectRatio').value,
        direction: $('direction').value, consent: $('consent').checked, idempotencyKey: submissionKey
      }) });
      persistKey(null); jobs = [result.job, ...jobs.filter(job => job.id !== result.job.id)]; renderHistory(); selectJob(result.job);
      status(result.job.status === 'failed' || result.job.status === 'uncertain' ? result.job.error : '任务已提交。可在此等待，或稍后查看视频记录。');
      await loadJobs();
    } catch (error) {
      status(`${error.message} 将保留本次提交标识。请先刷新记录；如需重查，使用同一提交标识不会重复创建任务。`);
      try { await loadJobs(); } catch { /* Retain the original failure and idempotency key. */ }
    } finally { busy = false; updateButton(); schedule(); }
  });
  async function reconcile(body) {
    if (!selected) return;
    const id = selected.id;
    $('attachTask').disabled = true; $('releaseTask').disabled = true;
    try { const result = await api(`jobs/${id}/reconcile`, { method: 'POST', body: JSON.stringify(body) }); selectJob(result.job); persistKey(null); await loadJobs(); }
    catch (error) { status(error.message); }
    finally { $('attachTask').disabled = false; $('releaseTask').disabled = !$('confirmNoTask').checked; }
  }
  $('attachTask').addEventListener('click', () => { const providerId = $('providerId').value.trim(); if (!providerId) return status('请填写服务商任务 ID。'); reconcile({ providerId }); });
  $('releaseTask').addEventListener('click', () => { if ($('confirmNoTask').checked) reconcile({ confirmedNotCreated: true }); });
  $('confirmNoTask').addEventListener('change', () => { $('releaseTask').disabled = !$('confirmNoTask').checked; });
  $('photo').addEventListener('change', event => preparePhoto(event.target.files[0]));
  const zone = $('uploadZone');
  for (const name of ['dragenter', 'dragover']) zone.addEventListener(name, event => { event.preventDefault(); zone.classList.add('dragging'); });
  for (const name of ['dragleave', 'drop']) zone.addEventListener(name, event => { event.preventDefault(); zone.classList.remove('dragging'); });
  zone.addEventListener('drop', event => preparePhoto(event.dataTransfer.files[0]));
  $('consent').addEventListener('change', updateButton);
  $('refreshHistory').addEventListener('click', refreshAll);
  $('refreshJob').addEventListener('click', refreshAll);
  $('resultVideo').addEventListener('error', () => { $('jobError').textContent = '视频播放失败，请刷新记录或下载 MP4 后查看。'; });
  function schedule() { clearTimeout(timer); timer = setTimeout(async () => { await refreshAll(); schedule(); }, 16000); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshAll(); });
  (async () => {
    try {
      const config = await api('config'); ready = config.ready;
      $('setup').textContent = ready ? '管理员内测已就绪 · 照片与结果保存在私有存储，生成任务不会自动重试。' : `尚未开启生成：${config.missing.join('；')}。可以先查看界面与本地照片预览。`;
      $('setup').classList.toggle('ready', ready); updateButton();
      await loadJobs();
    } catch (error) { $('historyStatus').textContent = error.message; $('setup').textContent = error.message; }
    schedule();
  })();
})();
