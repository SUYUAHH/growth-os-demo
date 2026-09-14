function number(value) { const text = String(value ?? '').trim().toUpperCase(); if (!text || text === '—' || text === '-') return null; const match = text.match(/([\d.]+)\s*([KMB万亿])?/); if (!match) return null; const n = Number(match[1]); const unit = match[2]; return Math.round(n * ({ K: 1e3, M: 1e6, B: 1e9, 万: 1e4, 亿: 1e8 }[unit] || 1)) }
function assessCandidate(candidate = {}) {
  const m = candidate.metrics || {}; const followers = number(candidate.author?.followers ?? candidate.followers); const impressions = number(m.impressions ?? candidate.views); const likes = number(m.likes ?? candidate.likes); const replies = number(m.replies ?? candidate.comments); const conversions = m.conversions ?? candidate.conversions ?? null; const tags = [...(candidate.tags || []), ...(candidate.trendTags || [])];
  const likeRate = impressions !== null && likes !== null ? Number((likes / Math.max(impressions, 1) * 100).toFixed(2)) : null
  const clues = []; if (impressions !== null && followers !== null) clues.push(`曝光/粉丝 ${ (impressions / Math.max(followers, 1)).toFixed(1)}x`); else clues.push('缺少曝光或粉丝基线')
  const paidEvidence = candidate.paidEvidence?.verified && candidate.paidEvidence.postId === candidate.id && candidate.paidEvidence.sourceUrl
  const ratio = followers && impressions ? impressions / followers : 0
  const paid = paidEvidence ? { label: '已投流', probability: 90, clues: ['已提供与当前内容匹配的投放记录'] } : tags.some(t => /投流|推广|广告/i.test(t)) || (ratio > 10 && likeRate !== null && likeRate < 2) ? { label: '疑似投流', probability: Math.min(78, Math.round(45 + Math.min(ratio, 20))), clues: ['曝光/粉丝比异常或命中推广线索', ...clues] } : { label: '自然增长倾向', probability: Math.max(8, Math.min(34, Math.round(18 + (likeRate || 0)))), clues: ['未命中投放记录，互动效率处于自然判断区间', ...clues] }
  const topicTag = tags.some(t => /热点|趋势|事件|热搜|话题|breaking/i.test(t)); const topic = topicTag ? { label: '有话题趋势', probability: 60 } : { label: '未发现明显话题趋势', probability: 12 }
  const comments = candidate.commentSamples || candidate.commentsData || []; const kolCount = comments.filter(c => (number(c.author?.followers ?? c.followers) || 0) >= 100000).length; const kol = { label: kolCount ? '发现大V/KOL评论' : '未发现大V/KOL评论', count: kolCount, sampleSize: comments.length }
  const conversion = conversions === null ? { label: '暂未产生转化' } : { label: conversions > 0 ? `已产生 ${conversions} 次转化` : '暂未产生转化' }
  const contentLabel = followers !== null && followers < 100000 && impressions !== null && impressions > followers * 5 ? '低粉爆款' : '常规样本'
  return { metrics: { followers, impressions, likes, replies, conversions, likeRate }, paid, topic, kol, conversion, contentLabel }
}
export { assessCandidate, number }
