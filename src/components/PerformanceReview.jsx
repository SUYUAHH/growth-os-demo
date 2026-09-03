import { useState } from 'react'
import { BarChart3, Check, Save } from 'lucide-react'
import { buildExperimentPlan, getDataReliability, summarizeCommentIntents } from '../lib/operationsAnalytics.js'

const fields = [['impressions', '曝光量'], ['likes', '点赞数'], ['comments', '评论数'], ['reposts', '转发数'], ['followersDelta', '粉丝变化']]

export default function PerformanceReview({ asset, onSave }) {
  const [metrics, setMetrics] = useState({ impressions: '', likes: '', comments: '', reposts: '', followersDelta: '' })
  const [saving, setSaving] = useState(false)
  const performance = asset.performance
  const plan = performance ? buildExperimentPlan(performance.review, asset) : null
  const reliability = getDataReliability(asset.dataReliability?.level === 'real' ? 'x-api' : 'demo', performance?.actual || asset.sourceMetrics)
  const commentSummary = summarizeCommentIntents(performance?.comments || asset.comments || [])
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try { await onSave(asset.id, Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, Number(value) || 0]))) } finally { setSaving(false) }
  }
  return <div className="performance-review">
    <div className="asset-detail-title"><strong><BarChart3 size={15} /> 发布后数据回流</strong><small>{performance ? `已记录 ${new Date(performance.recordedAt).toLocaleString('zh-CN')}` : '建议发布 24–48 小时后录入'}</small></div>
    <div className="data-reliability-note"><span>数据可信度：{reliability.label}</span><small>{reliability.detail}</small></div>
    {!performance ? <form className="performance-form" onSubmit={submit}>{fields.map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={metrics[key]} onChange={(event) => setMetrics((current) => ({ ...current, [key]: event.target.value }))} placeholder="0" /></label>)}<button className="secondary-button" type="submit" disabled={saving}><Save size={14} />{saving ? '保存中…' : '保存并生成复盘'}</button></form> : <>
      <div className="performance-metrics">{[['曝光', performance.actual.impressions.toLocaleString('zh-CN')], ['点赞率', `${performance.actual.likeRate}%`], ['评论率', `${performance.actual.commentRate}%`], ['转发率', `${performance.actual.repostRate}%`], ['粉丝变化', `${performance.actual.followersDelta >= 0 ? '+' : ''}${performance.actual.followersDelta}`]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div className={`performance-verdict ${performance.review.verdict === '达到预期' ? 'verdict-positive' : ''}`}><div><span className="pair-label">复盘结论</span><strong>{performance.review.verdict}</strong></div><p>{performance.review.summary}</p><span className="performance-recommendation"><Check size={13} /> 下一步：{performance.review.recommendation}</span><small>{performance.review.nextAction}</small></div>
      {performance.review.ruleFeedback?.length > 0 && <div className="rule-feedback"><span className="pair-label">规则命中反馈</span>{performance.review.ruleFeedback.map((item) => <span key={item.rule} className={item.result === '命中' ? 'feedback-hit' : ''}>{item.rule} · {item.result}</span>)}</div>}
      <div className="experiment-plan"><span className="pair-label">下一轮实验计划</span><strong>{plan.goal}</strong><p>变量：{plan.variable} · 对照：{plan.control} · 变体：{plan.variant}</p><small>样本 {plan.sampleSize} 条 / {plan.duration} · 关注 {plan.metrics.join('、')}</small></div>
      {commentSummary.total > 0 && <div className="comment-intent-summary"><span className="pair-label">评论意图摘要</span><strong>最高意图：{commentSummary.topIntent}</strong>{commentSummary.items.map((item) => <span key={item.intent}>{item.intent} · {item.count}</span>)}</div>}
    </>}
  </div>
}
