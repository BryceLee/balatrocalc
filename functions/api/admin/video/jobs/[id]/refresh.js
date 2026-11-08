import { route, json, getJob, publicJob, provider, outputURL, VideoError, ACTIVE } from '../../_shared.js';

async function downloadVideo(url) {
  const response = await fetch(outputURL(url), { redirect: 'manual', signal: AbortSignal.timeout(60000) });
  if (!response.ok || response.status !== 200 || !/^video\/mp4(?:;|$)/i.test(response.headers.get('Content-Type') || '')) throw new VideoError('生成已完成，但结果暂时无法保存，请刷新原任务。', 502);
  const max = 32 * 1024 * 1024;
  if (Number(response.headers.get('Content-Length')) > max) { await response.body?.cancel(); throw new VideoError('视频超过支持的文件大小。', 502); }
  const reader = response.body?.getReader(); if (!reader) throw new VideoError('视频内容为空。', 502);
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel(); throw new VideoError('视频超过支持的文件大小。', 502); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  if (size < 12 || String.fromCharCode(...bytes.subarray(4, 8)) !== 'ftyp') throw new VideoError('生成结果不是有效的 MP4。', 502);
  return bytes;
}

export const onRequestPost = route(async ({ env, params, data }) => {
  let job = await getJob(env, params.id, data.adminEmail);
  if (!ACTIVE.includes(job.status) || !job.provider_id) return json({ job: publicJob(job) });
  if (!env.AI_VIDEO_302_API_KEY || !env.AI_VIDEO_BUCKET) throw new VideoError('视频服务配置不完整。', 503);
  const now = Date.now();
  const claim = await env.DB.prepare("UPDATE ai_video_jobs SET poll_after=? WHERE id=? AND poll_after<=? AND status IN ('queued','generating','saving','uncertain')")
    .bind(now + 120000, job.id, now).run();
  if (!claim.meta.changes) return json({ job: publicJob(job) });
  try {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(job.provider_id)) throw new VideoError('任务编号无效。', 502);
    const result = await provider(`tasks/${job.provider_id}`, env);
    const state = result?.output?.task_status;
    const states = { PENDING: 'queued', RUNNING: 'generating', SUCCEEDED: 'saving', FAILED: 'failed', CANCELED: 'failed', CANCELLED: 'failed' };
    if (!states[state]) throw new VideoError('暂时无法确认生成进度，请稍后刷新。', 502);
    if (state === 'SUCCEEDED') {
      await env.DB.prepare("UPDATE ai_video_jobs SET status='saving',updated_at=? WHERE id=?").bind(Date.now(), job.id).run();
      const key = `ai-video/${job.id}/video.mp4`;
      const bytes = await downloadVideo(result.output.video_url);
      await env.AI_VIDEO_BUCKET.put(key, bytes, { httpMetadata: { contentType: 'video/mp4', cacheControl: 'private, no-store' } });
      await env.DB.prepare("UPDATE ai_video_jobs SET status='completed',video_key=?,error=NULL,updated_at=?,poll_after=0 WHERE id=?").bind(key, Date.now(), job.id).run();
    } else {
      await env.DB.prepare('UPDATE ai_video_jobs SET status=?,error=?,updated_at=?,poll_after=? WHERE id=?')
        .bind(states[state], states[state] === 'failed' ? '生成服务未完成该任务。请检查素材与设置。' : null, Date.now(), now + 15000, job.id).run();
    }
  } catch {
    // Read/download failures never create a replacement paid task.
    await env.DB.prepare("UPDATE ai_video_jobs SET error=?,poll_after=? WHERE id=? AND status!='completed'")
      .bind('进度查询或结果保存暂时失败，请稍后刷新原任务；不会重新生成。', Date.now() + 15000, job.id).run();
  }
  job = await getJob(env, job.id, data.adminEmail);
  return json({ job: publicJob(job) });
});
