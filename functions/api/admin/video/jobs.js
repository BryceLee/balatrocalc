import { route, json, VideoError, readJson, validatePhoto, validateSettings, requireReady, publicJob, provider } from './_shared.js';

export const onRequestGet = route(async ({ env, data }) => {
  if (!env.DB) throw new VideoError('尚未绑定数据库。', 503);
  const rows = await env.DB.prepare('SELECT * FROM ai_video_jobs WHERE owner=? ORDER BY created_at DESC LIMIT 30').bind(data.adminEmail).all();
  return json({ jobs: (rows.results || []).map(publicJob) });
});

export const onRequestPost = route(async ({ request, env, data }) => {
  await requireReady(env);
  const body = await readJson(request);
  const prompt = validateSettings(body);
  const bytes = validatePhoto(body.photo);
  const owner = data.adminEmail;
  const previous = await env.DB.prepare('SELECT * FROM ai_video_jobs WHERE owner=? AND idempotency_key=?').bind(owner, body.idempotencyKey).first();
  if (previous) return json({ job: publicJob(previous) });
  const id = crypto.randomUUID(), now = Date.now(), key = `ai-video/${id}/photo.jpg`;
  try {
    const inserted = await env.DB.prepare(`INSERT INTO ai_video_jobs
      (id,owner,idempotency_key,scene,duration,resolution,aspect_ratio,prompt,status,photo_key,created_at,updated_at)
      SELECT ?,?,?,?,?,?,?,?,'preparing',?,?,? WHERE (SELECT COUNT(*) FROM ai_video_jobs WHERE created_at>=?)<5`)
      .bind(id, owner, body.idempotencyKey, body.scene, body.duration, body.resolution, body.aspectRatio, prompt, key, now, now, Math.floor(now / 86400000) * 86400000).run();
    if (!inserted.meta.changes) throw new VideoError('今日内测生成上限为 5 次。', 429);
  } catch (error) {
    if (error instanceof VideoError) throw error;
    const duplicate = await env.DB.prepare('SELECT * FROM ai_video_jobs WHERE owner=? AND idempotency_key=?').bind(owner, body.idempotencyKey).first();
    if (duplicate) return json({ job: publicJob(duplicate) });
    throw new VideoError('已有进行中或状态待核实的任务，请先查看任务记录。', 409);
  }
  try {
    await env.AI_VIDEO_BUCKET.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg', cacheControl: 'private, no-store' } });
  } catch {
    await env.DB.prepare("UPDATE ai_video_jobs SET status='failed',error=?,updated_at=? WHERE id=?").bind('照片保存失败，未请求生成服务。', Date.now(), id).run();
    return json({ job: publicJob(await env.DB.prepare('SELECT * FROM ai_video_jobs WHERE id=?').bind(id).first()) }, 201);
  }
  // Persist a blocking state BEFORE making a potentially paid request.
  const claim = await env.DB.prepare("UPDATE ai_video_jobs SET status='submitting',updated_at=? WHERE id=? AND status='preparing'").bind(Date.now(), id).run();
  if (!claim.meta.changes) return json({ job: publicJob(await env.DB.prepare('SELECT * FROM ai_video_jobs WHERE id=?').bind(id).first()) }, 202);
  try {
    const result = await provider('services/aigc/video-generation/video-synthesis', env, {
      model: 'wan3.0-video', input: { prompt, media: [{ type: 'reference_image', url: body.photo }] },
      parameters: { duration: body.duration, resolution: body.resolution, ratio: body.aspectRatio, audio: true, prompt_extend: false, watermark: false }
    });
    const providerId = result?.output?.task_id;
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(providerId || '')) throw new VideoError('未收到可确认的生成任务编号。', 502);
    await env.DB.prepare("UPDATE ai_video_jobs SET status='queued',provider_id=?,updated_at=? WHERE id=?").bind(providerId, Date.now(), id).run();
  } catch (error) {
    const status = error.rejected ? 'failed' : 'uncertain';
    const message = status === 'uncertain' ? '提交状态待核实。请先核对 302.AI 后台，勿再次生成，以免重复扣费。' : '生成服务拒绝请求，请检查密钥、余额、模型权限和照片。';
    await env.DB.prepare('UPDATE ai_video_jobs SET status=?,error=?,updated_at=? WHERE id=?').bind(status, message, Date.now(), id).run();
  }
  return json({ job: publicJob(await env.DB.prepare('SELECT * FROM ai_video_jobs WHERE id=?').bind(id).first()) }, 202);
});
