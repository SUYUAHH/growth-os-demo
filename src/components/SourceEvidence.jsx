import { getDataReliability } from '../lib/operationsAnalytics.js'

export default function SourceEvidence({ asset, candidate }) {
  const metrics = candidate?.metrics || asset?.sourceMetrics || {}
  if (!asset && !candidate) return null
  return <div className="source-evidence"><span className="pair-label">原帖证据</span><div><span>粉丝 {candidate?.author?.followers || '—'}</span><span>点赞率 {candidate?.likeRate || '—'}</span><span>评论 {metrics.replies || metrics.comments || '—'}</span><span>转发 {metrics.reposts || '—'}</span><span>发布时间 {candidate?.createdAt ? new Date(candidate.createdAt).toLocaleString('zh-CN') : '—'}</span></div><small>来源：{candidate?.source || asset?.source || '本地 Demo'} · {getDataReliability(candidate?.sourceType || 'demo', metrics).label}</small></div>
}
