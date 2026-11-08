import { route, json, readJson, getJob, publicJob, provider, VideoError } from '../../_shared.js';

export const onRequestPost = route(async ({ request, env, params, data }) => {
  const job = await getJob(env, params.id, data.adminEmail);
  if (!['uncertain', 'preparing', 'submitting'].includes(job.status)) throw new VideoError('该任务无需核实提交状态。', 409);
  if (job.status !== 'uncertain' && Date.now() - job.updated_at < 300000) throw new VideoError('提交仍在进行，请至少等待 5 分钟后再核实。', 409);
  const body = await readJson(request, 2048);
  if (body.providerId) {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(body.providerId) || !env.AI_VIDEO_302_API_KEY) throw new VideoError('服务商任务编号或配置无效。');
    const result = await provider(`tasks/${body.providerId}`, env);
    if (!result?.output?.task_status) throw new VideoError('未查询到该服务商任务。');
    await env.DB.prepare("UPDATE ai_video_jobs SET status='queued',provider_id=?,error=NULL,updated_at=?,poll_after=0 WHERE id=? AND status IN ('uncertain','preparing','submitting')")
      .bind(body.providerId, Date.now(), job.id).run();
  } else if (body.confirmedNotCreated === true) {
    await env.DB.prepare("UPDATE ai_video_jobs SET status='failed',error=?,updated_at=? WHERE id=? AND status IN ('uncertain','preparing','submitting')")
      .bind('管理员已在服务商后台核实：未创建生成任务。', Date.now(), job.id).run();
  } else throw new VideoError('请填写已有任务编号，或确认已在服务商后台核实未创建任务。');
  return json({ job: publicJob(await getJob(env, job.id, data.adminEmail)) });
});
