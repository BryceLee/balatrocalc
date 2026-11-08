export const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer'
};
const ENDPOINT = 'https://api.302.ai/aliyun/api/v1';
export const ACTIVE = ['preparing', 'submitting', 'queued', 'generating', 'uncertain', 'saving'];

export class VideoError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { ...PRIVATE_HEADERS, 'Content-Type': 'application/json' } });
}
export function route(handler) {
  return async (context) => {
    try {
      // The root middleware alone supplies this identity after Basic auth.
      if (!context.data?.adminEmail) throw new VideoError('需要管理员登录。', 401);
      if (!['GET', 'HEAD'].includes(context.request.method)) {
        const origin = new URL(context.request.url).origin;
        if (context.request.headers.get('Origin') !== origin || context.request.headers.get('X-AI-Video') !== '1') {
          throw new VideoError('请求来源无效，请刷新页面重试。', 403);
        }
      }
      return await handler(context);
    } catch (error) {
      return json({ error: error instanceof VideoError ? error.message : '视频服务暂时不可用，请检查配置或稍后刷新。' }, error instanceof VideoError ? error.status : 503);
    }
  };
}
export function readiness(env) {
  const missing = [];
  if (env.AI_VIDEO_ENABLED !== 'true') missing.push('生成开关尚未开启');
  if (!env.AI_VIDEO_302_API_KEY) missing.push('尚未配置视频生成密钥');
  if (!env.DB) missing.push('尚未绑定数据库');
  if (!env.AI_VIDEO_BUCKET) missing.push('尚未绑定私有视频存储');
  return missing;
}
export async function requireReady(env) {
  const missing = readiness(env);
  if (missing.length) throw new VideoError(`${missing.join('；')}。`, 503);
  try { await env.DB.prepare('SELECT id FROM ai_video_jobs LIMIT 1').first(); }
  catch { throw new VideoError('尚未安装视频任务数据表。', 503); }
}
export async function readJson(request, limit = 3 * 1024 * 1024) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new VideoError('需要 JSON 请求。', 415);
  if (Number(request.headers.get('Content-Length')) > limit) throw new VideoError('上传内容过大。', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new VideoError('请求内容为空。');
  const chunks = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > limit) { await reader.cancel(); throw new VideoError('上传内容过大。', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new VideoError('请求内容无效。'); }
}
export function validatePhoto(value) {
  if (typeof value !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new VideoError('请上传有效照片。');
  let bytes;
  try { bytes = Uint8Array.from(atob(value.slice(23)), c => c.charCodeAt(0)); } catch { throw new VideoError('照片编码无效。'); }
  if (bytes.length < 100 || bytes.length > 2 * 1024 * 1024 || bytes[0] !== 255 || bytes[1] !== 216) throw new VideoError('准备后的照片必须为 2 MB 以内的 JPEG。');
  // Verify JPEG frame dimensions, including progressive JPEGs, before a paid call.
  let pos = 2; let size;
  while (pos + 4 < bytes.length) {
    if (bytes[pos++] !== 255) break;
    while (bytes[pos] === 255) pos++;
    const marker = bytes[pos++];
    if (marker === 217 || marker === 218) break;
    if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
    const length = bytes[pos] * 256 + bytes[pos + 1];
    if (length < 2 || pos + length > bytes.length) break;
    if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 8) {
      size = [bytes[pos + 5] * 256 + bytes[pos + 6], bytes[pos + 3] * 256 + bytes[pos + 4]]; break;
    }
    pos += length;
  }
  if (!size || Math.min(...size) < 240 || Math.max(...size) > 1600 || Math.max(...size) / Math.min(...size) > 8) throw new VideoError('照片尺寸不支持，请重新选择清晰的照片。');
  return bytes;
}
export function validateSettings(body) {
  if (!body || typeof body !== 'object' || !['dance', 'rap'].includes(body.scene) || ![6, 10].includes(body.duration) || !['480P', '720P'].includes(body.resolution) || !['9:16', '16:9'].includes(body.aspectRatio)) throw new VideoError('视频设置无效。');
  if (body.consent !== true) throw new VideoError('请确认有权使用照片，并同意发送给生成服务。');
  if (typeof body.direction !== 'string' || body.direction.length > 600) throw new VideoError('补充描述不能超过 600 字。');
  if (!/^[a-f0-9-]{36}$/.test(body.idempotencyKey || '')) throw new VideoError('任务标识无效，请刷新页面。');
  const action = body.scene === 'rap'
    ? 'Perform a playful rap on a small stage, bouncing to an original hip-hop beat, gesturing with one hand and holding a microphone in the other. Generate original upbeat rap vocals and music.'
    : 'Perform a joyful rhythmic dance with a simple side step and expressive arm movements, set to an original funky instrumental beat.';
  return `Use the person in Image 1 as the single main character. Keep their recognizable facial features. Reimagine them as a Balatro-inspired playing-card jester: colorful jester hat, red and blue costume, pixel-art details, a green felt stage and a playing-card border. ${action} One continuous shot, full body visible, stable face and hands, playful arcade atmosphere. No text or logos. Additional direction: ${body.direction.trim()}`;
}
export function publicJob(job) {
  return { id: job.id, scene: job.scene, duration: job.duration, resolution: job.resolution, aspectRatio: job.aspect_ratio, status: job.status, error: job.error, createdAt: job.created_at, updatedAt: job.updated_at,
    photoURL: `/api/admin/video/jobs/${job.id}/media?kind=photo`,
    videoURL: job.status === 'completed' ? `/api/admin/video/jobs/${job.id}/media` : null };
}
export async function getJob(env, id, owner) {
  if (!/^[a-f0-9-]{36}$/.test(id || '')) throw new VideoError('任务不存在。', 404);
  const job = await env.DB.prepare('SELECT * FROM ai_video_jobs WHERE id=? AND owner=?').bind(id, owner).first();
  if (!job) throw new VideoError('任务不存在。', 404);
  return job;
}
export async function provider(path, env, body) {
  let response;
  try {
    response = await fetch(`${ENDPOINT}/${path}`, {
      method: body ? 'POST' : 'GET', redirect: 'manual', signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${env.AI_VIDEO_302_API_KEY}`, 'Content-Type': 'application/json', ...(body ? { 'X-DashScope-Async': 'enable' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch { throw new VideoError('生成服务连接中断，请查询原任务，勿重复提交。', 502); }
  if (response.status >= 300 && response.status < 400) throw new VideoError('生成服务返回异常跳转，请核对原任务。', 502);
  let result;
  try { result = await response.json(); } catch { throw new VideoError('生成服务返回无法确认的响应，请核对原任务。', 502); }
  if (!response.ok || result?.error || (result?.code != null && ![0, 200, '0', '200'].includes(result.code))) {
    const error = new VideoError('生成服务拒绝请求，请核对密钥、余额、模型权限和素材。', 502);
    // Only explicit client rejection is known not to have created a paid task.
    error.rejected = (response.status >= 400 && response.status < 500 && response.status !== 408) || (response.ok && typeof result?.code === 'string');
    throw error;
  }
  return result;
}
export function outputURL(value) {
  let url; try { url = new URL(value); } catch { throw new VideoError('生成结果地址无效。', 502); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !(url.hostname === 'file.302.ai' || /^[a-z0-9-]+\.tos-[a-z0-9-]+\.volces\.com$/.test(url.hostname) || /^dashscope-result-[a-z0-9-]+\.oss-[a-z0-9-]+\.aliyuncs\.com$/.test(url.hostname))) throw new VideoError('生成结果地址不受支持。', 502);
  return url.href;
}
