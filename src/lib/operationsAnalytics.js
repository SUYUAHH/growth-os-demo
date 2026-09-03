export function classifyCommentIntent(text = '') {
  const value = String(text).toLowerCase()
  if (/where|link|链接|哪里买|地址|购买/.test(value)) return '求链接/购买'
  if (/how|怎么|步骤|教程|做法|recipe|攻略/.test(value)) return '求教程/步骤'
  if (/same|我也|我有|经历|试过|同感/.test(value)) return '经验分享'
  if (/why|真的吗|质疑|不觉得|骗人|假的/.test(value)) return '质疑/争议'
  if (/love|喜欢|太棒|好看|beautiful|amazing/.test(value)) return '正向反馈'
  return '其他评论'
}

export function summarizeCommentIntents(comments = []) {
  const values = Array.isArray(comments) ? comments : []
  const counts = new Map()
  values.filter(Boolean).forEach((comment) => {
    const intent = classifyCommentIntent(comment)
    counts.set(intent, (counts.get(intent) || 0) + 1)
  })
  const items = [...counts.entries()].map(([intent, count]) => ({ intent, count })).sort((left, right) => right.count - left.count)
  return { total: values.filter(Boolean).length, topIntent: items[0]?.intent || '暂无评论', items }
}

export function getCandidateRecommendation(candidate = {}) {
  const tags = candidate.tags || []
  const ready = tags.includes('高匹配') && (tags.includes('低粉爆款') || tags.includes('高点赞率') || tags.includes('高价值'))
  if (ready) return { action: '立即进入爆款拆解', assetReady: true, reason: `${tags.filter((tag) => ['低粉爆款', '高点赞率', '高价值', '高匹配'].includes(tag)).join(' + ')}，优先验证可迁移机制。` }
  if (tags.includes('高粉高质量')) return { action: '进入账号模仿研究', assetReady: false, reason: '账号体量成熟，先拆解表达边界和内容结构，不直接复制。' }
  if (tags.includes('低竞争') && tags.includes('适合系列化')) return { action: '进入选题规划', assetReady: false, reason: '竞争低且可连续生产，适合先规划栏目再资产化。' }
  return { action: '继续观察', assetReady: false, reason: '信号不足，继续收集互动和评论意图后再决策。' }
}

export function buildPerformancePortfolio(assets = []) {
  const published = assets.filter((asset) => asset?.performance?.actual)
  const aggregate = (items) => {
    const actual = items.reduce((sum, asset) => ({ impressions: sum.impressions + Number(asset.performance.actual.impressions || 0), likes: sum.likes + Number(asset.performance.actual.likes || 0), comments: sum.comments + Number(asset.performance.actual.comments || 0), followersDelta: sum.followersDelta + Number(asset.performance.actual.followersDelta || 0) }), { impressions: 0, likes: 0, comments: 0, followersDelta: 0 })
    return { posts: items.length, ...actual, likeRate: actual.impressions ? Number((actual.likes / actual.impressions * 100).toFixed(2)) : 0, commentRate: actual.impressions ? Number((actual.comments / actual.impressions * 100).toFixed(2)) : 0 }
  }
  const byChannel = Object.fromEntries([...new Set(published.map((asset) => asset.channel || 'X'))].map((channel) => [channel, aggregate(published.filter((asset) => (asset.channel || 'X') === channel))]))
  const byTag = Object.fromEntries([...new Set(published.flatMap((asset) => asset.tags || []))].map((tag) => [tag, aggregate(published.filter((asset) => (asset.tags || []).includes(tag)))]))
  const bestDimension = Object.entries(byTag).sort((left, right) => right[1].commentRate - left[1].commentRate)[0]?.[0] || '暂无标签'
  return { sampleSize: published.length, byChannel, byTag, bestDimension }
}

export function getDataReliability(source = 'demo', metrics = {}) {
  const hasImpressions = Number(metrics.impressions || metrics.views || 0) > 0
  if (source === 'x-api' && hasImpressions) return { label: '真实数据', level: 'real', detail: '来自 X API，指标完整' }
  if (source === 'x-api') return { label: '部分真实', level: 'partial', detail: '来自 X API，但曝光量可能不可用' }
  if (source === 'demo') return { label: 'Demo 数据', level: 'demo', detail: '用于演示流程，不代表真实运营结果' }
  return { label: '数据缺失', level: 'missing', detail: '缺少必要指标，暂不参与比例计算' }
}

export function buildExperimentPlan(review = {}, asset = {}) {
  const recommendation = review.recommendation || '继续收集数据'
  const goal = recommendation === '继续复用' ? '验证主题机制能否稳定复现' : recommendation === '调整方向' ? '提升内容互动效率' : '寻找新的内容方向'
  return { goal, variable: recommendation === '调整方向' ? '文字钩子、CTA 和发布时间' : '主题机制与素材表达', control: '沿用当前版本', variant: recommendation === '停止复用' ? '更换选题机制' : '保留主题，替换首句和素材', sampleSize: 3, duration: '7 天', metrics: ['点赞率', '评论率', '粉丝转化'], sourceAssetId: asset.id }
}

export function buildPublishRecord(asset = {}, input = {}) {
  const publishedAt = input.publishedAt || asset.publishedAt || asset.publishAt || new Date().toISOString()
  return {
    id: input.id || `publish-${asset.id || Date.now()}-${Date.now()}`,
    assetId: asset.id || input.assetId,
    channel: asset.channel || input.channel || 'X',
    accountId: asset.accountId || input.accountId || null,
    url: input.url || asset.publishUrl || '',
    operator: input.operator || '运营负责人',
    versionId: input.versionId || asset.versions?.at(-1)?.id || null,
    versionLabel: input.versionLabel || asset.versions?.at(-1)?.label || 'V1 AI 初稿',
    mediaDecision: input.mediaDecision || asset.mediaDecision || '未记录',
    publishedAt,
    localTime: localTimeLabel(publishedAt, input.timeZone || 'America/Los_Angeles'),
  }
}

export function buildVersionEntry(input = {}) {
  return {
    id: input.id || `version-${Date.now()}`,
    label: input.label || '未命名版本',
    body: input.body || '',
    operator: input.operator || '运营负责人',
    createdAt: input.createdAt || new Date().toISOString(),
  }
}

export function getAccountOperatingProfile(account = {}) {
  return {
    targetAudience: account.targetAudience || '待补充目标人群',
    contentPillars: account.contentPillars || [account.categoryLabel || '待补充内容支柱'],
    contentGuardrails: account.contentGuardrails || ['避免绝对化承诺', '保留人工确认'],
    timeZone: account.timeZone || 'America/Los_Angeles',
  }
}

export function localTimeLabel(date, timeZone = 'America/Los_Angeles') {
  return new Intl.DateTimeFormat('zh-CN', { timeZone, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(date))
}
