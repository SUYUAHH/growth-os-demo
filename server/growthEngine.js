import { managedAccounts, trends as seedTrends } from '../src/data/mockData.js'
import { mergeCapturedPosts, normalizeBenchmarkAccount } from './contentCapture.js'
import { buildPublishRecord, buildVersionEntry, getAccountOperatingProfile, getDataReliability, summarizeCommentIntents } from '../src/lib/operationsAnalytics.js'

const priorityWeight = { P0: 0, P1: 1, P2: 2 }

export const candidateStatuses = ['待分配', '待拆解', '拆解中', '待生成', '待审核', '已确认', '待发布', '已发布', '已归档']
const statusTransitions = {
  待分配: ['待拆解'], 待拆解: ['拆解中', '已归档'], 拆解中: ['待生成', '已归档'], 待生成: ['待审核', '已归档'],
  待审核: ['已确认', '已归档'], 已确认: ['待发布', '待审核', '已归档'], 待发布: ['已发布', '待审核', '已归档'], 已发布: ['已归档'], 已归档: [],
}

export const contentCategories = [
  { key: 'lifestyle', label: '生活方式', english: 'Lifestyle' },
  { key: 'food', label: '美食餐饮', english: 'Food & Dining' },
  { key: 'travel', label: '旅行户外', english: 'Travel & Outdoors' },
]

export const intelligenceRules = [
  { id: 'high-value', label: '高价值', description: '互动表现和信息密度同时较高，值得优先拆解。', criterion: '浏览量 ≥ 5M 且点赞率 ≥ 4.5%' },
  { id: 'high-match', label: '高匹配', description: '内容与当前账号定位、受众和分类更贴合。', criterion: '相关度 ≥ 85' },
  { id: 'low-competition', label: '低竞争', description: '同类内容供给相对少，适合快速测试。', criterion: '竞争度 = 低' },
  { id: 'comment-driven', label: '评论驱动', description: '评论意图明显，适合围绕问题继续创作。', criterion: '评论率 ≥ 0.35%' },
  { id: 'series-ready', label: '适合系列化', description: '主题可重复、可拆成步骤或连续场景。', criterion: '内容带有系列化或可复刻信号' },
  { id: 'low-follower-breakout', label: '低粉爆款', description: '粉丝基数不高但内容互动效率突出。', criterion: '粉丝 ≤ 200K 且点赞率 ≥ 5.5%' },
  { id: 'high-follower-quality', label: '高粉高质量', description: '成熟账号仍保持稳定的互动质量。', criterion: '粉丝 ≥ 250K 且点赞率 ≥ 5.5%' },
  { id: 'x-paid-decision', label: 'X 投流判断', description: '结合 X Ads 投放记录、曝光/粉丝比和互动结构判断，不把高曝光直接等同于投流。', criterion: '已投流：匹配 post_id 与 Campaign；疑似投流：曝光/粉丝异常或推广线索；自然增长倾向：互动结构与账号基线匹配' },
  { id: 'topic-trend', label: '话题趋势关联', description: '识别热点、趋势、事件和搜索话题带来的外部放大。', criterion: '命中话题标签或趋势数据：有话题趋势；否则：未发现明显话题趋势' },
]

const categoryByKey = new Map(contentCategories.map((item) => [item.key, item]))
const categoryAliases = new Map([
  ['生活方式', 'lifestyle'], ['Lifestyle', 'lifestyle'],
  ['美食餐饮', 'food'], ['Food & Dining', 'food'], ['Food', 'food'],
  ['旅行户外', 'travel'], ['Travel & Outdoors', 'travel'], ['Travel', 'travel'],
])

export function normalizeCategory(value, index = 0) {
  const key = categoryByKey.has(value) ? value : categoryAliases.get(value)
  return categoryByKey.get(key || contentCategories[index % contentCategories.length].key)
}

function withCategory(item, index = 0) {
  const category = normalizeCategory(item.category, index)
  const seed = seedTrends.find((trend) => trend.id === item.id || trend.title === item.title)
  const merged = {
    ...(seed || {}),
    ...item,
    followers: item.followers ?? seed?.followers,
    likes: item.likes ?? seed?.likes,
    likeRate: item.likeRate ?? seed?.likeRate,
    comments: item.comments ?? seed?.comments,
    publishedAt: item.publishedAt ?? seed?.publishedAt,
    recommendation: item.recommendation ?? seed?.recommendation,
    category: category.key,
    categoryLabel: category.label,
    categoryKey: category.key.toUpperCase(),
  }
  const evaluation = evaluateHotspot(merged)
  return { ...merged, hotspotScore: merged.hotspotScore ?? evaluation.score, selectionLabel: merged.selectionLabel ?? evaluation.selectionLabel, tags: [...new Set([...(merged.tags || []), ...evaluation.tags])] }
}

export function filterTrendsByCategory(trends = [], category = 'all') {
  return category === 'all' ? trends : trends.filter((trend) => trend.category === normalizeCategory(category).key)
}

function metricNumber(value) {
  if (typeof value === 'number') return value
  const text = String(value || '').replace(/,/g, '').trim().toUpperCase()
  const amount = Number.parseFloat(text)
  if (!Number.isFinite(amount)) return 0
  if (text.endsWith('M')) return amount * 1000000
  if (text.endsWith('K')) return amount * 1000
  return amount
}

export function evaluateHotspot(trend = {}) {
  const followers = metricNumber(trend.followerCount ?? trend.followers)
  const likes = metricNumber(trend.likeCount ?? trend.likes)
  const comments = metricNumber(trend.commentCount ?? trend.comments)
  const views = metricNumber(trend.impressionCount ?? trend.views)
  const likeRate = metricNumber(trend.likeRate) || (views ? (likes / views) * 100 : 0)
  const commentRate = views ? (comments / views) * 100 : 0
  const tags = []
  let selectionLabel = '持续观察'
  if (followers > 0 && followers <= 200000 && likeRate >= 5.5) {
    tags.push('低粉爆款')
    selectionLabel = '小号爆发，优先观察'
  }
  if (followers >= 250000 && likeRate >= 5.5) {
    tags.push('高粉高质量')
    selectionLabel = '高粉高质量，适合对标'
  }
  if (likeRate >= 7) tags.push('高点赞率')
  if (commentRate >= 0.35) tags.push('高评论意图')
  if (views >= 5000000 && likeRate >= 4.5) tags.push('高价值')
  if ((trend.relevance ?? 0) >= 85) tags.push('高匹配')
  if (trend.competition === '低') tags.push('低竞争')
  if (/系列|连载|步骤|路线|做法|routine|trail|dinner/i.test(`${trend.title || ''} ${trend.action || ''} ${trend.tags?.join(' ') || ''}`)) tags.push('适合系列化')
  const reposts = metricNumber(trend.repostCount ?? trend.reposts)
  const repostRate = views ? (reposts / views) * 100 : 0
  const relevance = Math.max(0, Math.min(100, Number(trend.relevance ?? 70)))
  const breakdown = { 互动效率: Math.min(30, likeRate * 3), 评论意图: Math.min(20, commentRate * 30), 转发扩散: Math.min(15, repostRate * 30), 内容穿透: Math.min(20, followers && views ? (views / followers) * 4 : 0), 账号匹配: relevance * 0.15 }
  const score = Math.min(100, Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0)))
  return { followerCount: followers, likeRate: Number(likeRate.toFixed(1)), commentRate: Number(commentRate.toFixed(2)), repostRate: Number(repostRate.toFixed(2)), score, scoreBreakdown: Object.fromEntries(Object.entries(breakdown).map(([key, value]) => [key, Math.round(value)])), tags, selectionLabel }
}

export function evaluateAccountHealth(account = {}) {
  const signals = account.signals || []
  const signalValue = (match, fallback) => signals.find((signal) => match.test(signal.label || ''))?.value ?? fallback
  const metrics = account.metrics || {}
  const breakdown = { 内容表现: signalValue(/选题|内容/, 72), 互动质量: signalValue(/评论|互动/, Math.min(100, (metrics.engagementRate || 5) * 10)), 粉丝增长: signalValue(/增长|粉丝/, 70), 发布稳定: signalValue(/发布|节奏/, 75), 合规风险: account.metrics?.connectionStatus === '数据异常' ? 55 : 90 }
  const weights = { 内容表现: 0.3, 互动质量: 0.25, 粉丝增长: 0.2, 发布稳定: 0.15, 合规风险: 0.1 }
  const score = Math.round(Object.entries(breakdown).reduce((sum, [key, value]) => sum + value * weights[key], 0))
  return { score, breakdown, weights }
}

export const healthRules = [
  { id: 'content-performance', label: '内容表现', weight: 30, good: '选题匹配、内容质量和热点承接稳定', warning: '选题匹配度持续低于 65 分', action: '复盘近 7 日高表现内容，重做选题和开头测试' },
  { id: 'engagement-quality', label: '互动质量', weight: 25, good: '评论、点赞和收藏体现真实讨论意图', warning: '互动率下降或评论停留在低意图反馈', action: '拆分评论意图，优化 CTA 和评论承接' },
  { id: 'follower-growth', label: '粉丝增长', weight: 20, good: '粉丝增长与内容表现保持正向关系', warning: '内容有曝光但粉丝转化不足', action: '检查账号定位、关注理由和连续栏目设计' },
  { id: 'publishing-stability', label: '发布稳定', weight: 15, good: '发布频率和发布时间窗口相对稳定', warning: '连续缺更或发布节奏波动明显', action: '建立周发布计划，保留可复用的内容模板' },
  { id: 'compliance-risk', label: '合规风险', weight: 10, good: '未发现高风险表达，账号状态正常', warning: '出现平台风险、异常数据或违规表达信号', action: '进入规则库人工复核，暂停直接发布' },
]

export function buildHealthScore(account = {}) {
  const fallback = evaluateAccountHealth(account)
  const values = account.healthBreakdown || fallback.breakdown
  const weights = { 内容表现: 30, 互动质量: 25, 粉丝增长: 20, 发布稳定: 15, 合规风险: 10 }
  const dimensions = Object.entries(weights).map(([label, weight]) => ({ label, value: Number(values[label] ?? 0), weight, contribution: Math.round(Number(values[label] ?? 0) * weight / 100) }))
  return { score: Math.round(dimensions.reduce((sum, item) => sum + item.contribution, 0)), dimensions }
}

export function buildAccountPerformanceSummary(history = []) {
  const entries = history.filter((item) => item?.actual)
  if (!entries.length) return { sampleSize: 0, trend: '暂无样本', dimensions: {} }
  const average = (key) => entries.reduce((sum, item) => sum + Number(item.actual?.[key] || 0), 0) / entries.length
  const successRate = entries.filter((item) => item.review?.verdict === '达到预期').length / entries.length
  const dimensions = {
    内容表现: Math.round(Math.min(100, 55 + average('likeRate') * 5 + successRate * 20)),
    互动质量: Math.round(Math.min(100, 45 + average('likeRate') * 4 + average('commentRate') * 20)),
    粉丝增长: Math.round(Math.min(100, Math.max(0, 65 + average('followersDelta') / 5))),
  }
  return { sampleSize: entries.length, trend: successRate >= 0.67 ? '表现稳定' : '需要优化', dimensions }
}

export function rankHotspots(trends = []) {
  return [...trends].sort((left, right) => (right.hotspotScore ?? right.relevance ?? 0) - (left.hotspotScore ?? left.relevance ?? 0))
}

export function evaluateXDistribution(input = {}) {
  const text = String(input.text || '').trim()
  const length = text.length
  const hasHook = /^[^.!?。！？]{8,90}[.!?。！？]/.test(text) || /你|如何|为什么|最容易|不要|不需要|how|why|you/i.test(text.slice(0, 90))
  const hasCta = /评论|告诉我|你会|你呢|分享|reply|comment|what changed|agree/i.test(text)
  const risk = /保证|稳赚|唯一|百分之百|绝对|guaranteed|risk[- ]?free|only way/i.test(text)
  const checks = [
    { id: 'hook', name: '文字钩子', status: hasHook ? '通过' : '建议修改', detail: hasHook ? '首句包含明确判断或问题，适合 X 信息流阅读。' : '首句较平，建议在前 90 个字符内加入冲突或具体判断。' },
    { id: 'length', name: '文案长度', status: length >= 40 && length <= 280 ? '通过' : '建议修改', detail: `${length} 字符；建议控制在 40–280 字符，保留快速阅读节奏。` },
    { id: 'cta', name: '互动引导', status: hasCta ? '通过' : '建议修改', detail: hasCta ? '包含可回答的评论引导。' : '建议用具体问题收尾，避免只写“欢迎关注”。' },
    { id: 'compliance', name: '平台风险', status: risk ? '人工确认' : '通过', detail: risk ? '检测到绝对化或保证性表达，需要人工确认。' : '未发现明显绝对化承诺。' },
    { id: 'media', name: '素材决定', status: input.hasMedia ? '通过' : '人工确认', detail: input.hasMedia ? '已有参考素材，发布前确认原创和版权边界。' : '没有素材，需要补图、补视频或确认 AI 生成方案。' },
  ]
  const status = checks.some((check) => check.status === '人工确认') ? '人工确认' : checks.some((check) => check.status === '建议修改') ? '建议修改' : '通过'
  const nextAction = !input.hasMedia ? '补充素材并人工确认' : status === '建议修改' ? '修改文案后重新检查' : status === '人工确认' ? '人工确认风险后进入待发布' : '可以进入待发布'
  return { channel: 'X', status, score: Math.round(checks.filter((check) => check.status === '通过').length / checks.length * 100), checks, nextAction, publishWindow: input.publishHour >= 18 && input.publishHour <= 21 ? '晚间 18:00–21:00' : '建议测试晚间 18:00–21:00' }
}

const defaultStrategies = [
  {
    id: 'tuesday-night-test',
    benchmark: 'One Pan Table',
    category: 'food', categoryLabel: '美食餐饮', categoryKey: 'FOOD',
    title: '周二晚上测试：简单的晚餐，才是真实的生活',
    mechanism: '高频工作日场景 + 困扰到轻松的情绪转折',
    reusable: '先呈现用户在压力场景下的判断，再用一个具体步骤兑现它。',
    avoid: '不复制对标账号的固定人设、原句和“perfect routine”标签。',
    expressionSimilarity: 18,
    mechanismSimilarity: 42,
    risk: '低',
    status: '可进入候选池',
  },
  {
    id: 'weekend-reset-story',
    benchmark: 'Weekend Outside',
    category: 'travel', categoryLabel: '旅行户外', categoryKey: 'TRAVEL',
    title: '周末就是新的重启键',
    mechanism: '情绪化户外叙事',
    reusable: '把抽象感受落到一条可执行的路线和一个具体停留点。',
    avoid: '该表达与对标账号的人设和高频措辞高度重合。',
    expressionSimilarity: 48,
    mechanismSimilarity: 68,
    risk: '高',
    status: '需要人工改写',
  },
]

const demoAccountMetrics = [
  { impressions: 842000, likes: 53888, comments: 4210, saves: 7560, posts: 5, likeRate: 6.4, engagementRate: 7.8, connectionStatus: '已连接', connectionDetail: 'X 数据同步正常', trend: [58, 63, 60, 72, 68, 81, 86] },
  { impressions: 516000, likes: 21672, comments: 1980, saves: 1644, posts: 3, likeRate: 4.2, engagementRate: 4.9, connectionStatus: '数据异常', connectionDetail: '评论意图密度连续下滑', trend: [71, 68, 64, 57, 53, 48, 45] },
  { impressions: 482000, likes: 31330, comments: 2860, saves: 2948, posts: 4, likeRate: 6.5, engagementRate: 7.7, connectionStatus: '待授权', connectionDetail: 'Demo 状态：等待账号授权', trend: [54, 57, 62, 65, 67, 70, 74] },
]

function now() {
  return new Date().toISOString()
}

function activity(text, type = 'review') {
  return { time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), text, type }
}

function issueFor(account, index = 0) {
  const priority = account.health < 70 ? 'P0' : account.health < 80 ? 'P1' : 'P2'
  return {
    id: `${account.id}-issue-${index + 1}`,
    title: account.issue || '需要补充账号诊断',
    category: account.issueType || '内容表达',
    priority,
    evidence: account.signals?.find((signal) => signal.tone === 'negative')?.label || `健康评分 ${account.health || 0}`,
    impact: '影响内容表现的稳定性和下一轮选题判断。',
    action: account.action || '确认问题后创建可验证的行动任务。',
  }
}

function normalizedAccount(account, index) {
  const seed = managedAccounts.find((item) => item.id === account.id)
  const legacy = !account.category || /Auto|EV|Drive/i.test(account.name || '')
  const source = seed && legacy ? { ...account, ...seed } : account
  const issues = Array.isArray(source.issues) && source.issues.length ? source.issues.slice(0, 3) : [issueFor(source)]
  const category = normalizeCategory(source.category, index)
  const metrics = account.metrics || source.metrics || demoAccountMetrics[index % demoAccountMetrics.length]
  const healthEvaluation = evaluateAccountHealth({ ...source, metrics })
  return { ...source, ...categoryFields(category), ...getAccountOperatingProfile(source), issues, metrics, healthBreakdown: healthEvaluation.breakdown, calculatedHealth: healthEvaluation.score }
}

function categoryFields(category) {
  return { category: category.key, categoryLabel: category.label, categoryKey: category.key.toUpperCase() }
}

function detailedImagePrompt(title = '主题内容') {
  return `主体：${title.slice(0, 42)}，一位自然状态的年轻成年人正在进行与主题相关的真实动作，人物外观普通、有生活感，不摆拍。环境：干净整洁的真实室内生活空间，保留桌面、墙面和少量日常物件作为环境线索。动作：主体正在专注完成一个具体步骤，手部动作清晰，画面能看出事情正在发生。构图：竖版 4:5，中近景，主体位于画面左侧三分之一，右侧留出适合社交媒体文字排版的呼吸空间，视线和动作形成引导线。光线：窗边柔和自然光，从左前方进入，阴影真实细腻，明暗层次自然。质感：纪实生活方式摄影，真实皮肤和材质细节，低饱和暖色，轻微景深，35mm 镜头，高清但不过度锐化。氛围：松弛、可信、可执行，像真实用户分享而不是广告。输出：无文字、无 logo、无水印、无品牌标识。负面提示词：不要棚拍，不要夸张表情，不要塑料皮肤，不要多余手指或肢体，不要畸变，不要过度磨皮，不要文字，不要 logo，不要水印，不要虚假产品包装。`;
}

export function normalizeGrowthState(state) {
  const accounts = (state.accounts || []).map(normalizedAccount)
  const rawTrends = state.trends || []
  const legacyTrends = rawTrends.some((trend) => /car|commute|luxury|vehicle|汽车|通勤|豪华|新能源/i.test(`${trend.title} ${trend.sourcePost || ''}`))
  const trends = (legacyTrends ? seedTrends : rawTrends).map((trend, index) => {
    const normalized = withCategory(trend, index)
    // Keep the persisted demo snapshot aligned with the current X-only remix scenario.
    if (normalized.id === 'quiet-luxury') return { ...normalized, source: 'X 公开样本快照', platform: 'X' }
    if (normalized.id === 'first-car' || normalized.id === 'tiny-upgrade') return { ...normalized, source: 'X Trend Radar · Community', platform: 'X' }
    return normalized
  })
  const rawCandidates = state.candidatePool || []
  const legacyCandidates = rawCandidates.some((candidate) => /car|commute|luxury|vehicle|汽车|通勤|豪华|新能源/i.test(`${candidate.title} ${candidate.source || ''}`))
  const candidatePool = (legacyCandidates ? [] : rawCandidates).map((candidate, index) => {
    const normalized = withCategory(candidate, index)
    const status = candidate.status === '待分析' ? '待拆解' : (candidate.status || (candidate.accountId ? '待拆解' : '待分配'))
    return { ...normalized, status, accountId: candidate.accountId || null, accountName: candidate.accountName || '未分配', dataReliability: candidate.dataReliability || getDataReliability(candidate.sourceType || 'demo', candidate.metrics), commentSummary: candidate.commentSummary || summarizeCommentIntents(candidate.comments || []), statusHistory: candidate.statusHistory?.length ? candidate.statusHistory : [{ status, at: candidate.addedAt || now(), actor: 'system' }], ruleReviews: candidate.ruleReviews || [] }
  })
  const rawStrategies = state.benchmarkStrategies || []
  const legacyStrategies = rawStrategies.some((strategy) => /car|commute|luxury|vehicle|drive with maya|everyday motion|汽车|通勤|豪华|新能源/i.test(`${strategy.title} ${strategy.benchmark}`))
  return {
    ...state,
    accounts,
    trends,
    candidatePool,
    activity: state.activity || [],
    leaderTasks: state.leaderTasks || [],
    dailyReports: state.dailyReports || [],
    benchmarkStrategies: rawStrategies.length && !legacyStrategies ? rawStrategies : defaultStrategies,
    benchmarkAccounts: state.benchmarkAccounts || [],
    contentLibrary: state.contentLibrary || [],
    captureBatches: state.captureBatches || [],
    assets: (state.assets || []).map((asset) => ({ ...asset, imagePrompt: asset.imagePrompt && asset.imagePrompt.length >= 80 ? asset.imagePrompt : detailedImagePrompt(asset.title || asset.chineseTitle || '主题内容'), versions: asset.versions || [buildVersionEntry({ label: 'V1 AI 初稿', body: asset.chineseBody || asset.draft || '' })], publishRecords: asset.publishRecords || [] })),
  }
}

export function addBenchmarkAccount(state, input) {
  const account = normalizeBenchmarkAccount(input)
  const current = normalizeGrowthState(state)
  return { ...current, benchmarkAccounts: [account, ...current.benchmarkAccounts.filter((item) => item.id !== account.id && item.username.toLowerCase() !== account.username.toLowerCase())] }
}

export function saveCapturedPosts(state, posts = [], batch = {}) {
  const current = normalizeGrowthState(state)
  const contentLibrary = mergeCapturedPosts(current.contentLibrary, posts)
  const capturedIds = new Set(posts.map((post) => post.id))
  const benchmarkAccounts = current.benchmarkAccounts.map((account) => account.id === batch.sourceId ? { ...account, capturedCount: contentLibrary.filter((post) => post.sourceId === account.id).length, lastCapturedAt: new Date().toISOString(), status: '监测中' } : account)
  const record = { id: `capture-${Date.now()}`, sourceType: batch.sourceType || 'keyword', sourceId: batch.sourceId || null, query: batch.query || '', requestedAt: new Date().toISOString(), count: capturedIds.size, status: posts.length ? '全部成功' : '部分成功' }
  return { ...current, contentLibrary, benchmarkAccounts, captureBatches: [record, ...current.captureBatches].slice(0, 30), activity: [{ time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), text: `内容抓取完成：${record.count} 条`, type: 'insight' }, ...current.activity].slice(0, 30) }
}

export function createCandidateFromCapturedPost(state, post, accountId = post?.accountId || null) {
  if (!post?.id || !post?.text) throw new Error('抓取内容不完整')
  const current = normalizeGrowthState(state)
  const resolvedAccountId = accountId || post?.accountId || current.accounts.find((item) => item.category === post.category)?.id || (current.accounts.length === 1 ? current.accounts[0].id : null)
  const account = current.accounts.find((item) => item.id === resolvedAccountId)
  const status = account ? '待拆解' : '待分配'
  const candidate = { id: `captured-${post.id}`, postId: post.id, title: post.text, source: post.sources?.join(' · ') || post.sourceType || 'X', sourceType: post.sourceType || 'demo', author: post.author, metrics: post.metrics, dataReliability: getDataReliability(post.sourceType || 'demo', post.metrics), commentSummary: summarizeCommentIntents(post.comments || []), media: post.media || [], createdAt: post.createdAt, externalUrl: post.url, status, addedAt: now(), accountId: account?.id || null, accountName: account?.name || '未分配', poolScope: account ? 'account' : 'global', category: post.category || account?.category || 'technology', categoryLabel: post.categoryLabel || account?.categoryLabel || '科技 / AI / 投资', categoryKey: post.categoryKey || 'TECHNOLOGY', tags: post.tags || [], statusHistory: [{ status, at: now(), actor: 'operator' }], ruleReviews: [] }
  return { ...current, candidatePool: [candidate, ...current.candidatePool.filter((item) => item.id !== candidate.id)].slice(0, 50), activity: [activity(`已收录抓取内容：${post.text.slice(0, 36)}`, 'insight'), ...current.activity].slice(0, 30) }
}

export function transitionCandidate(state, candidateId, nextStatus) {
  const prepared = normalizeGrowthState(state)
  const candidate = prepared.candidatePool.find((item) => item.id === candidateId)
  if (!candidate) throw new Error('找不到候选内容')
  if (!candidateStatuses.includes(nextStatus) || !statusTransitions[candidate.status]?.includes(nextStatus)) throw new Error(`状态从“${candidate.status}”到“${nextStatus}”不允许`)
  const entry = { status: nextStatus, at: now(), actor: 'operator' }
  return { ...prepared, candidatePool: prepared.candidatePool.map((item) => item.id === candidateId ? { ...item, status: nextStatus, statusHistory: [...(item.statusHistory || []), entry] } : item), activity: [activity(`候选内容已进入：${nextStatus}`, 'review'), ...prepared.activity].slice(0, 30) }
}

export function getCandidatesForAccount(state, accountId = 'all') {
  const prepared = normalizeGrowthState(state)
  return accountId === 'all' ? prepared.candidatePool : prepared.candidatePool.filter((item) => item.accountId === accountId)
}

export function assignCandidate(state, candidateId, accountId = null) {
  const prepared = normalizeGrowthState(state)
  const candidate = prepared.candidatePool.find((item) => item.id === candidateId)
  if (!candidate) throw new Error('找不到候选内容')
  const account = prepared.accounts.find((item) => item.id === accountId)
  if (!account) throw new Error('找不到对应账号')
  return { ...prepared, candidatePool: prepared.candidatePool.map((item) => item.id === candidateId ? { ...item, accountId: account.id, accountName: account.name, poolScope: 'account', status: item.status === '待分配' ? '待拆解' : item.status, statusHistory: item.status === '待分配' ? [...item.statusHistory, { status: '待拆解', at: now(), actor: 'operator' }] : item.statusHistory } : item) }
}

export function createContentAsset(input = {}) {
  const title = String(input.title || '未命名内容').trim()
  const media = input.media || []
  return { id: input.id || `asset-${Date.now()}`, candidateId: input.candidateId || null, accountId: input.accountId || null, status: '待审核', title, originalText: input.originalText || title, source: input.source || '候选池', sourceMetrics: input.sourceMetrics || {}, dataReliability: input.dataReliability || getDataReliability(input.sourceType || 'demo', input.sourceMetrics), tags: input.tags || [], chineseTitle: input.chineseTitle || `关于「${title.slice(0, 22)}」的实用分享`, chineseBody: input.chineseBody || `围绕“${title}”，用一个具体场景说明问题、方法和可执行步骤。`, cta: input.cta || '你会怎么做？欢迎在评论区分享。', mediaBrief: input.mediaBrief || '建议使用真实场景图片，突出主体、动作和结果。', imagePrompt: input.imagePrompt || detailedImagePrompt(title), mediaStatus: media.length ? '已有参考素材，需确认版权和原创使用方式' : '暂无可用图片，需要生成或补拍', channel: input.channel || 'X', timeZone: input.timeZone || 'America/Los_Angeles', versions: [buildVersionEntry({ label: 'V1 AI 初稿', body: input.chineseBody || '' })], publishRecords: [], publishReadiness: { account: Boolean(input.accountId), channel: Boolean(input.channel || 'X'), schedule: Boolean(input.publishAt), media: media.length > 0, complete: Boolean(input.accountId && (input.channel || 'X') && input.publishAt && media.length > 0) }, media }
}

export function transitionAsset(state, assetId, nextStatus) {
  const prepared = normalizeGrowthState(state)
  const asset = prepared.assets.find((item) => item.id === assetId)
  if (!asset) throw new Error('找不到内容资产')
  const allowed = { 待审核: ['已确认'], 已确认: ['待发布', '待审核'], 待发布: ['已发布', '待审核'], 已发布: ['已归档'] }
  if (!allowed[asset.status]?.includes(nextStatus)) throw new Error(`资产状态从“${asset.status}”到“${nextStatus}”不允许`)
  if (nextStatus === '待发布' && !asset.publishReadiness?.complete) throw new Error('请先补齐账号、渠道、发布时间和素材决定')
  const changedAt = now()
  return { ...prepared, assets: prepared.assets.map((item) => item.id === assetId ? { ...item, status: nextStatus, confirmedAt: nextStatus === '已确认' ? changedAt : item.confirmedAt, publishedAt: nextStatus === '已发布' ? changedAt : item.publishedAt, publishRecords: nextStatus === '已发布' ? [...(item.publishRecords || []), buildPublishRecord({ ...item, publishedAt: changedAt }, { timeZone: item.timeZone })] : item.publishRecords, statusHistory: [...(item.statusHistory || []), { status: nextStatus, at: changedAt, actor: 'operator' }] } : item), activity: [activity(`内容资产已进入：${nextStatus}`, 'review'), ...prepared.activity].slice(0, 30) }
}

export function prepareAssetForPublish(state, assetId, input = {}) {
  const prepared = normalizeGrowthState(state)
  const asset = prepared.assets.find((item) => item.id === assetId)
  if (!asset) throw new Error('找不到内容资产')
  const publishAt = input.publishAt ?? asset.publishAt
  const channel = input.channel ?? asset.channel ?? 'X'
  const mediaDecision = input.mediaDecision ?? asset.mediaDecision
  const hasMediaDecision = asset.media?.length > 0 || Boolean(mediaDecision)
  const publishReadiness = { account: Boolean(asset.accountId), channel: Boolean(channel), schedule: Boolean(publishAt), media: hasMediaDecision, complete: Boolean(asset.accountId && channel && publishAt && hasMediaDecision) }
  return { ...prepared, assets: prepared.assets.map((item) => item.id === assetId ? { ...item, publishAt, channel, mediaDecision, publishUrl: input.publishUrl ?? item.publishUrl ?? '', publishReadiness, preparedAt: now() } : item), activity: [activity('内容资产发布准备度已更新', 'review'), ...prepared.activity].slice(0, 30) }
}

function percentage(value, total) {
  return total > 0 ? Number((value / total * 100).toFixed(2)) : 0
}

export function recordPublishedPerformance(state, assetId, metrics = {}) {
  const prepared = normalizeGrowthState(state)
  const asset = prepared.assets.find((item) => item.id === assetId)
  if (!asset) throw new Error('找不到内容资产')
  if (asset.status !== '已发布') throw new Error('只有已发布资产可以录入数据')

  const actual = {
    impressions: metricNumber(metrics.impressions),
    likes: metricNumber(metrics.likes),
    comments: metricNumber(metrics.comments),
    reposts: metricNumber(metrics.reposts),
    followersDelta: metricNumber(metrics.followersDelta),
  }
  actual.likeRate = percentage(actual.likes, actual.impressions)
  actual.commentRate = percentage(actual.comments, actual.impressions)
  actual.repostRate = percentage(actual.reposts, actual.impressions)
  const expected = asset.expected || {}
  const impressionAchievement = expected.impressions ? actual.impressions / metricNumber(expected.impressions) : null
  const likeRateTarget = metricNumber(expected.likeRate)
  const commentTarget = metricNumber(expected.comments)
  const coreResults = [
    impressionAchievement === null ? null : impressionAchievement >= 1,
    likeRateTarget ? actual.likeRate >= likeRateTarget : null,
    commentTarget ? actual.comments >= commentTarget : null,
  ].filter((value) => value !== null)
  const interactionWeak = likeRateTarget > 0 && actual.likeRate < likeRateTarget * 0.8
  const exposureStrong = impressionAchievement !== null && impressionAchievement >= 1.2
  const hasEnoughComparison = coreResults.length > 0
  const passedCount = coreResults.filter(Boolean).length
  const verdict = !hasEnoughComparison ? '数据不足' : passedCount >= Math.ceil(coreResults.length * 0.67) ? '达到预期' : '未达到预期'
  const recommendation = !hasEnoughComparison ? '继续收集数据' : interactionWeak && exposureStrong ? '调整方向' : passedCount === 0 ? '停止复用' : verdict === '达到预期' ? '继续复用' : '调整方向'
  const ruleFeedback = (asset.tags || []).map((rule) => ({ rule, result: rule === '评论驱动' ? (actual.commentRate >= 0.35 ? '命中' : '未命中') : rule === '低粉爆款' ? (actual.likeRate >= 5.5 ? '命中' : '未命中') : rule === '高点赞率' ? (actual.likeRate >= 7 ? '命中' : '未命中') : '待积累更多样本' }))
  const review = {
    verdict,
    summary: !hasEnoughComparison ? '已记录真实表现，暂缺少预估值，建议继续收集 24–48 小时数据。' : interactionWeak && exposureStrong ? '曝光已经达到，但互动效率偏弱，说明标题获得了分发，内容承接或评论引导仍需调整。' : verdict === '达到预期' ? '核心表现达到预估目标，可将结构和选题机制沉淀为可复用模板。' : '核心指标未完全达到预估，需要结合发布时间、钩子和互动引导继续定位原因。',
    recommendation,
    nextAction: recommendation === '继续复用' ? '保留主题机制，测试新的首句和素材变体。' : recommendation === '停止复用' ? '停止沿用当前表达，回到候选池重新选择方向。' : recommendation === '调整方向' ? '保留选题但重做文字钩子、CTA 和发布时间，进行下一轮小样本测试。' : '等待数据稳定后再判断是否复用。',
    impressionAchievement: impressionAchievement === null ? null : Number((impressionAchievement * 100).toFixed(1)),
    ruleFeedback,
  }
  const recordedAt = now()
  const account = prepared.accounts.find((item) => item.id === asset.accountId)
  const performanceFeedback = { lastAssetId: assetId, verdict, recommendation, recordedAt }
  const healthDelta = verdict === '达到预期' ? 3 : verdict === '未达到预期' ? -3 : 0
  return {
    ...prepared,
    assets: prepared.assets.map((item) => item.id === assetId ? { ...item, performance: { recordedAt, expected, actual, review } } : item),
    accounts: account ? prepared.accounts.map((item) => {
      if (item.id !== account.id) return item
      const history = [...prepared.assets.filter((candidate) => candidate.accountId === account.id && candidate.performance).map((candidate) => candidate.performance), { actual, review }]
      const performanceSummary = buildAccountPerformanceSummary(history)
      const dynamicDelta = performanceSummary.trend === '需要优化' ? -2 : healthDelta
      return { ...item, health: Math.max(0, Math.min(100, Number(item.health || 0) + dynamicDelta)), performanceFeedback: { ...performanceFeedback, performanceSummary } }
    }) : prepared.accounts,
    activity: [activity(`发布后数据已回流：${asset.chineseTitle || asset.title || assetId} · ${verdict}`, 'insight'), ...prepared.activity].slice(0, 30),
  }
}

export function applyRuleReview(state, candidateId, review = {}) {
  const prepared = normalizeGrowthState(state)
  const candidate = prepared.candidatePool.find((item) => item.id === candidateId)
  if (!candidate) throw new Error('找不到候选内容')
  if (!review.ruleId || !review.status) throw new Error('规则和审核结果不能为空')
  const item = { ruleId: review.ruleId, status: review.status, note: review.note?.trim() || '', reviewer: review.reviewer || '运营负责人', at: now() }
  return { ...prepared, candidatePool: prepared.candidatePool.map((candidateItem) => candidateItem.id === candidateId ? { ...candidateItem, ruleReviews: [...(candidateItem.ruleReviews || []), item] } : candidateItem), activity: [activity(`已记录规则审核：${item.status}`, 'review'), ...prepared.activity].slice(0, 30) }
}

export function buildAccountPortfolio(state) {
  const prepared = normalizeGrowthState(state)
  const accounts = prepared.accounts
  const totals = accounts.reduce((summary, account) => ({
    impressions: summary.impressions + account.metrics.impressions,
    likes: summary.likes + account.metrics.likes,
    comments: summary.comments + account.metrics.comments,
    saves: summary.saves + account.metrics.saves,
    posts: summary.posts + account.metrics.posts,
  }), { impressions: 0, likes: 0, comments: 0, saves: 0, posts: 0 })
  totals.likeRate = accounts.length ? Number((accounts.reduce((sum, account) => sum + account.metrics.likeRate, 0) / accounts.length).toFixed(1)) : 0
  totals.engagementRate = accounts.length ? Number((accounts.reduce((sum, account) => sum + account.metrics.engagementRate, 0) / accounts.length).toFixed(1)) : 0
  const connections = { '已连接': 0, '待授权': 0, 'Token 即将过期': 0, '数据异常': 0 }
  const health = { healthy: 0, attention: 0, risk: 0 }
  accounts.forEach((account) => {
    connections[account.metrics.connectionStatus] = (connections[account.metrics.connectionStatus] || 0) + 1
    if (account.health < 70) health.risk += 1
    else if (account.health < 80) health.attention += 1
    else health.healthy += 1
  })
  const trend = Array.from({ length: 7 }, (_, index) => Math.round(accounts.reduce((sum, account) => sum + account.metrics.trend[index], 0) / Math.max(accounts.length, 1)))
  return { accounts, totals, connections, health, trend, funnel: { signals: prepared.trends?.length || 0, candidates: prepared.candidatePool.length, drafts: prepared.assets?.length || 0, review: prepared.assets?.filter((asset) => asset.status === '待审核').length || 0, published: 0 } }
}

export function createLeaderTask(state, input) {
  const prepared = normalizeGrowthState(state)
  const account = prepared.accounts.find((item) => item.id === input.accountId)
  if (!account) throw new Error('找不到对应的托管账号')
  if (!input.title?.trim()) throw new Error('任务标题不能为空')
  const task = {
    id: `leader-task-${Date.now()}`,
    accountId: account.id,
    title: input.title.trim(),
    owner: input.owner?.trim() || '运营负责人',
    dueDate: input.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    metric: input.metric?.trim() || '下次日报确认是否改善',
    status: '进行中',
    createdAt: now(),
  }
  return { ...prepared, leaderTasks: [task, ...prepared.leaderTasks], activity: [activity(`Leader 创建行动任务：${task.title}`), ...prepared.activity].slice(0, 30) }
}

export function completeLeaderTask(state, taskId) {
  const prepared = normalizeGrowthState(state)
  const task = prepared.leaderTasks.find((item) => item.id === taskId)
  if (!task) throw new Error('找不到对应的 Leader 任务')
  const leaderTasks = prepared.leaderTasks.map((item) => item.id === taskId ? { ...item, status: '已完成', completedAt: now() } : item)
  return { ...prepared, leaderTasks, activity: [activity(`Leader 任务已完成：${task.title}`), ...prepared.activity].slice(0, 30) }
}

export function generateDailyReport(state) {
  const prepared = normalizeGrowthState(state)
  const priorityIssues = prepared.accounts.flatMap((account) => account.issues.map((issue) => ({ ...issue, accountId: account.id, accountName: account.name }))).sort((left, right) => priorityWeight[left.priority] - priorityWeight[right.priority]).slice(0, 5)
  const open = prepared.leaderTasks.filter((task) => task.status !== '已完成').length
  const completed = prepared.leaderTasks.length - open
  const score = prepared.accounts.length ? Math.round(prepared.accounts.reduce((sum, account) => sum + (account.health || 0), 0) / prepared.accounts.length) : 0
  const report = {
    id: `daily-report-${Date.now()}`,
    generatedAt: now(),
    overallScore: score,
    assessment: score >= 80 ? '可放大有效动作' : score >= 70 ? '稳步改善，优先处理关键短板' : '需要 Leader 介入',
    priorityIssues,
    taskProgress: { open, completed, total: prepared.leaderTasks.length },
    accountSummaries: prepared.accounts.map((account) => ({ accountId: account.id, name: account.name, health: account.health, issueCount: account.issues.length })),
  }
  return { ...prepared, dailyReports: [report, ...prepared.dailyReports].slice(0, 14), activity: [activity('已生成多账号 Leader 每日报告'), ...prepared.activity].slice(0, 30) }
}

export function createCandidateFromStrategy(state, strategyId) {
  const prepared = normalizeGrowthState(state)
  const strategy = prepared.benchmarkStrategies.find((item) => item.id === strategyId)
  if (!strategy) throw new Error('找不到对应的对标策略')
  if (strategy.expressionSimilarity >= 35) throw new Error('该策略表达相似度偏高，需要人工改写后才能加入候选池。')
  const candidate = {
    id: `strategy-${strategy.id}`,
    strategyId: strategy.id,
    title: strategy.title,
    source: `对标策略 · ${strategy.benchmark}`,
    category: strategy.category,
    categoryLabel: strategy.categoryLabel,
    categoryKey: strategy.categoryKey,
    status: '待分析',
    addedAt: now(),
    mechanismSimilarity: strategy.mechanismSimilarity,
    expressionSimilarity: strategy.expressionSimilarity,
  }
  return { ...prepared, candidatePool: [candidate, ...prepared.candidatePool.filter((item) => item.id !== candidate.id)].slice(0, 30), activity: [activity(`对标策略已进入候选池：${strategy.title}`, 'insight'), ...prepared.activity].slice(0, 30) }
}
