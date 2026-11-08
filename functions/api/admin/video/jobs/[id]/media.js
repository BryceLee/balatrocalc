import { route, getJob, PRIVATE_HEADERS, VideoError } from '../../_shared.js';

export const onRequestGet = route(async ({ request, env, params, data }) => {
  const job = await getJob(env, params.id, data.adminEmail);
  const url = new URL(request.url), photo = url.searchParams.get('kind') === 'photo';
  const key = photo ? job.photo_key : job.status === 'completed' ? job.video_key : null;
  if (!key || !env.AI_VIDEO_BUCKET) throw new VideoError('文件尚未就绪。', 404);
  const head = await env.AI_VIDEO_BUCKET.head(key);
  if (!head) throw new VideoError('文件不存在。', 404);
  let range;
  const raw = request.headers.get('Range');
  if (raw) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(raw);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { ...PRIVATE_HEADERS, 'Content-Range': `bytes */${head.size}` } });
    const start = match[1] ? Number(match[1]) : Math.max(0, head.size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(head.size - 1, Number(match[2])) : head.size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= head.size) return new Response(null, { status: 416, headers: { ...PRIVATE_HEADERS, 'Content-Range': `bytes */${head.size}` } });
    range = { offset: start, length: end - start + 1 };
  }
  const object = await env.AI_VIDEO_BUCKET.get(key, range ? { range } : undefined);
  if (!object) throw new VideoError('文件不存在。', 404);
  return new Response(object.body, { status: range ? 206 : 200, headers: {
    ...PRIVATE_HEADERS, 'Content-Type': photo ? 'image/jpeg' : 'video/mp4', 'Accept-Ranges': 'bytes',
    'Content-Length': String(range ? range.length : head.size),
    ...(range ? { 'Content-Range': `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}` } : {}),
    ...(url.searchParams.get('download') === '1' && !photo ? { 'Content-Disposition': `attachment; filename="balatro-joker-${job.id}.mp4"` } : {})
  } });
});
