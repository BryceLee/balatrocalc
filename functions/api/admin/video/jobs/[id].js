import { route, json, getJob, publicJob, ACTIVE, VideoError } from '../_shared.js';
export const onRequestGet = route(async ({ env, params, data }) => json({ job: publicJob(await getJob(env, params.id, data.adminEmail)) }));
export const onRequestDelete = route(async ({ env, params, data }) => {
  const job = await getJob(env, params.id, data.adminEmail);
  if (ACTIVE.includes(job.status)) throw new VideoError('进行中或待核实的任务不能删除。', 409);
  await env.AI_VIDEO_BUCKET.delete(job.photo_key);
  if (job.video_key) await env.AI_VIDEO_BUCKET.delete(job.video_key);
  await env.DB.prepare('DELETE FROM ai_video_jobs WHERE id=? AND owner=?').bind(job.id, data.adminEmail).run();
  return json({ ok: true });
});
