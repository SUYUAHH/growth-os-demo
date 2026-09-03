export const qualityRules = [
  { id: 'hook', name: '文字钩子', scope: 'X 文本首句', description: '首句需要有明确问题、冲突或可验证判断。' },
  { id: 'value', name: '信息价值', scope: '正文结构', description: '至少包含具体事实、步骤、案例或数字，避免只有态度。' },
  { id: 'engagement', name: '互动潜力', scope: '互动数据', description: '结合点赞、评论、转发与作者粉丝基数判断讨论意图。' },
  { id: 'compliance', name: '合规风险', scope: '文本表达', description: '识别绝对化承诺、保证收益和可能误导用户的表达。' },
  { id: 'originality', name: '原创边界', scope: '对标关系', description: '允许借鉴机制，不直接复制原句、人设和固定标签。' },
]

const absoluteClaims = /唯一|保证|百分之百|稳赚|绝对|guaranteed|only way|100%|risk[- ]?free/i

export function evaluateContentQuality(post = {}) {
  const text = String(post.text || '').trim()
  const metrics = post.metrics || {}
  const followers = Number(post.author?.followers || 0)
  const hasEngagementContext = Number(metrics.impressions || 0) > 0 && followers > 0
  const firstSentence = text.split(/[.!?。！？]/)[0].trim()
  const hasHook = firstSentence.includes('?') || firstSentence.includes('？') || firstSentence.length <= 90
  const hasValue = text.length >= 45 && /\d|three|steps|how|because|案例|步骤|方法|数据/i.test(text)
  const checks = [
    { id: 'hook', name: '文字钩子', status: hasHook ? '通过' : '建议修改', detail: hasHook ? '首句具备问题或明确判断。' : '首句偏平，需要增加问题、冲突或具体结果。' },
    { id: 'value', name: '信息价值', status: hasValue ? '通过' : '建议修改', detail: hasValue ? '正文包含可验证的信息线索。' : '建议补充数字、步骤、案例或事实。' },
    { id: 'engagement', name: '互动潜力', status: hasEngagementContext ? '通过' : '人工确认', detail: hasEngagementContext ? '互动数据具备粉丝基数对照。' : '缺少曝光量或粉丝基数，不能直接判断真实互动质量。' },
    { id: 'compliance', name: '合规风险', status: absoluteClaims.test(text) ? '人工确认' : '通过', detail: absoluteClaims.test(text) ? '发现绝对化承诺或保证性表达，需要人工确认。' : '未发现高风险绝对化表达。' },
    { id: 'originality', name: '原创边界', status: '人工确认', detail: '需要人工确认改写后没有复用原帖原句、人设和固定标签。' },
  ]
  const status = checks.find((check) => check.id === 'compliance')?.status === '人工确认' ? '人工确认' : checks.some((check) => check.status !== '通过') ? '建议修改' : '通过'
  return { status, score: Math.round((checks.filter((check) => check.status === '通过').length / checks.length) * 100), checks, recommendation: status === '通过' ? '可以进入人工审核，重点确认账号语气。' : status === '建议修改' ? '先补强首句或事实信息，再进入人工审核。' : '存在需要人工判断的风险，暂不建议直接发布。' }
}
