import { evaluatePaidReadiness } from './paidDistributionRules.js'
export function evaluateCandidatePaidSignal(candidate = {}, trend = {}) {
  const merged = { ...trend, followers: trend.followers || candidate.author?.followers, views: trend.views || candidate.metrics?.impressions, comments: trend.comments || candidate.metrics?.replies, likeRate: trend.likeRate || '0%', tags: [...new Set([...(trend.tags || []), ...(candidate.tags || [])])] }
  const promoted = Boolean(candidate.paidDistribution?.status === '已投流' || candidate.paidDistribution?.status === '疑似投流' || candidate.tags?.some((tag) => /投流|推广|广告|promoted/i.test(tag)))
  const result = evaluatePaidReadiness(merged, Boolean(candidate.paidDistribution?.naturalTested))
  return { promoted, promotedLabel: promoted ? '疑似/曾投流' : '未发现投流证据', recommendation: result.decision, tone: promoted ? 'warning' : result.canApply ? 'positive' : 'neutral', evidence: promoted ? '标签或历史记录存在投流信号，不能作为自然基线。' : '当前没有投流标记；仍需结合平台投放记录核验。' }
}
export function evaluateHotspotSignal(candidate = {}, trend = {}) {
  const tags = [...new Set([...(candidate.tags || []), ...(trend.tags || [])])]
  const views = Number(String(trend.views || candidate.metrics?.impressions || 0).replace(/[^0-9.]/g, '')) || 0
  const followers = Number(String(trend.followers || candidate.author?.followers || 0).replace(/[^0-9.]/g, '')) || 0
  const tagged = tags.some((tag) => /热点|趋势|事件|热搜|话题|实时|breaking/i.test(tag))
  const ratio = followers ? views / followers : 0
  const probability = Math.min(95, Math.max(5, Math.round((tagged ? 58 : 10) + (ratio > 10 ? 22 : ratio > 5 ? 12 : 0))))
  return { probability, label: probability >= 70 ? '高概率蹭热点' : probability >= 40 ? '疑似借势' : '未发现明显蹭热点', evidence: tagged ? '命中热点/趋势标签，需结合发布时间与同热点内容对照。' : ratio > 10 ? '曝光显著高于粉丝规模，可能存在外部话题放大。' : '当前未命中热点标签，外部话题信号较弱。' }
}
