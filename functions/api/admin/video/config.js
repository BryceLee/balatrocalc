import { route, json, readiness } from './_shared.js';
export const onRequestGet = route(async ({ env }) => {
  const missing = readiness(env);
  if (env.DB) {
    try { await env.DB.prepare('SELECT id FROM ai_video_jobs LIMIT 1').first(); }
    catch { missing.push('尚未安装视频任务数据表'); }
  }
  return json({ ready: !missing.length, missing, maxDailyJobs: 5 });
});
