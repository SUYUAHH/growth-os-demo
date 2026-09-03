import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAccountPortfolio,
  completeLeaderTask,
  createCandidateFromStrategy,
  createLeaderTask,
  generateDailyReport,
  filterTrendsByCategory,
  evaluateHotspot,
  rankHotspots,
  candidateStatuses,
  createCandidateFromCapturedPost,
  transitionCandidate,
  getCandidatesForAccount,
  createContentAsset,
  assignCandidate,
  transitionAsset,
  prepareAssetForPublish,
  applyRuleReview,
  normalizeGrowthState,
  buildHealthScore,
  healthRules,
  evaluateXDistribution,
  recordPublishedPerformance,
  buildAccountPerformanceSummary,
} from '../server/growthEngine.js'
import { getSelectedVisibleTrend } from '../src/lib/trendSelection.js'
import { getInterfaceCopy, navLabels, uiText } from '../src/lib/i18n.js'
import { evaluateContentQuality, qualityRules } from '../src/lib/contentQuality.js'
import { accountSnapshot, filterByAccount } from '../src/lib/accountScope.js'
import { evaluateComplianceRules, evaluatePlatformRules, getPlatformBrief, platformRules } from '../src/lib/platformRules.js'
import { buildExperimentPlan, buildPerformancePortfolio, buildPublishRecord, buildVersionEntry, classifyCommentIntent, getAccountOperatingProfile, getCandidateRecommendation, getDataReliability, localTimeLabel, summarizeCommentIntents } from '../src/lib/operationsAnalytics.js'
import { buildAcquisitionFunnel, buildMarketPlaybook, buildGrowthAttribution, buildKOLPipeline } from '../src/lib/growthOps.js'
import { filterCandidates } from '../src/lib/candidateViews.js'
import { trends } from '../src/data/mockData.js'
import { getAudienceProfile } from '../src/lib/audienceProfile.js'

const baseState = {
  accounts: [{ id: 'account-1', name: 'North Star', health: 68, issue: 'Hook retention is low', action: 'Test a personal opener.' }],
  candidatePool: [],
  activity: [],
}

test('resolves an account audience profile from explicit data or category fallback', () => {
  assert.equal(getAudienceProfile({ category: 'food' }).primarySegment.includes('北美年轻家庭'), true)
  assert.equal(getAudienceProfile({ audienceProfile: { primarySegment: 'Custom' } }).primarySegment, 'Custom')
})

test('normalizes legacy state with growth intelligence collections', () => {
  const state = normalizeGrowthState(baseState)
  assert.equal(state.leaderTasks.length, 0)
  assert.equal(state.dailyReports.length, 0)
  assert.ok(state.benchmarkStrategies.length >= 1)
  assert.equal(state.accounts[0].issues.length, 1)
})

test('creates and completes a Leader task for a managed account', () => {
  const prepared = normalizeGrowthState(baseState)
  const created = createLeaderTask(prepared, { accountId: 'account-1', title: 'Classify high-intent comments', owner: 'Mia', dueDate: '2026-08-20', metric: 'Topic conversion >= 20%' })
  assert.equal(created.leaderTasks[0].status, '进行中')
  const completed = completeLeaderTask(created, created.leaderTasks[0].id)
  assert.equal(completed.leaderTasks[0].status, '已完成')
})

test('generates a daily report with account priorities and task progress', () => {
  const prepared = normalizeGrowthState(baseState)
  const state = createLeaderTask(prepared, { accountId: 'account-1', title: 'Classify high-intent comments', owner: 'Mia', dueDate: '2026-08-20', metric: 'Topic conversion >= 20%' })
  const reported = generateDailyReport(state)
  assert.equal(reported.dailyReports.length, 1)
  assert.equal(reported.dailyReports[0].priorityIssues.length, 1)
  assert.equal(reported.dailyReports[0].taskProgress.open, 1)
})

test('promotes only a low-risk benchmark strategy to the candidate pool', () => {
  const prepared = normalizeGrowthState(baseState)
  const safe = prepared.benchmarkStrategies.find((strategy) => strategy.expressionSimilarity < 35)
  const promoted = createCandidateFromStrategy(prepared, safe.id)
  assert.equal(promoted.candidatePool[0].strategyId, safe.id)
  const risky = prepared.benchmarkStrategies.find((strategy) => strategy.expressionSimilarity >= 35)
  assert.throws(() => createCandidateFromStrategy(prepared, risky.id), /人工改写/)
})

test('builds an account portfolio with aggregate metrics and connection states', () => {
  const prepared = normalizeGrowthState({
    accounts: [
      { id: 'a', name: 'A', health: 82, issue: 'None', action: 'Keep testing.' },
      { id: 'b', name: 'B', health: 66, issue: 'Retention', action: 'Fix hook.' },
      { id: 'c', name: 'C', health: 74, issue: 'Cadence', action: 'Plan posts.' },
    ],
  })
  const portfolio = buildAccountPortfolio(prepared)
  assert.equal(portfolio.accounts.length, 3)
  assert.ok(portfolio.totals.impressions > 0)
  assert.ok(portfolio.totals.likeRate > 0)
  assert.equal(portfolio.connections['已连接'] + portfolio.connections['待授权'] + portfolio.connections['数据异常'] + portfolio.connections['Token 即将过期'], 3)
  assert.equal(portfolio.health.risk, 1)
})

test('normalizes the three interest categories and filters matching hotspots', () => {
  const state = normalizeGrowthState({
    accounts: [
      { id: 'lifestyle-account', name: 'Lifestyle', health: 80 },
      { id: 'food-account', name: 'Food', health: 80 },
      { id: 'travel-account', name: 'Travel', health: 80 },
    ],
    trends: [
      { id: 'life-trend', title: 'Life', category: 'lifestyle' },
      { id: 'food-trend', title: 'Food', category: 'food' },
      { id: 'travel-trend', title: 'Travel', category: 'travel' },
    ],
  })
  assert.deepEqual(state.accounts.map((item) => item.category), ['lifestyle', 'food', 'travel'])
  assert.deepEqual(state.accounts.map((item) => item.categoryLabel), ['生活方式', '美食餐饮', '旅行户外'])
  assert.deepEqual(filterTrendsByCategory(state.trends, 'food').map((item) => item.id), ['food-trend'])
})

test('migrates legacy automotive strategies and candidates to the current taxonomy', () => {
  const state = normalizeGrowthState({
    accounts: [],
    benchmarkStrategies: [{ id: 'old', benchmark: 'Drive with Maya', title: '下班后的车，才是真实的车' }],
    candidatePool: [{ id: 'old-candidate', title: '大家真的会收藏的小升级', source: 'Local signal stream · 通勤' }],
  })
  assert.equal(state.benchmarkStrategies.some((item) => /car|luxury|drive/i.test(`${item.title} ${item.benchmark}`)), false)
  assert.equal(state.candidatePool.some((item) => /car|luxury|vehicle/i.test(`${item.title} ${item.source}`)), false)
  assert.ok(state.benchmarkStrategies.every((item) => ['food', 'travel'].includes(item.category)))
})

test('keeps the hotspot detail inside the active category filter', () => {
  const visible = [{ id: 'food-trend' }, { id: 'food-trend-2' }]
  assert.equal(getSelectedVisibleTrend(visible, { id: 'travel-trend' }).id, 'food-trend')
  assert.equal(getSelectedVisibleTrend(visible, { id: 'food-trend-2' }).id, 'food-trend-2')
  assert.equal(getSelectedVisibleTrend([], { id: 'travel-trend' }).id, 'travel-trend')
})

test('provides decision metrics and a recommendation for every hotspot', () => {
  assert.ok(trends.length >= 3)
  for (const trend of trends) {
    assert.match(String(trend.followers), /\d/)
    assert.match(String(trend.likes), /\d/)
    assert.match(String(trend.likeRate), /%$/)
    assert.match(String(trend.comments), /\d/)
    assert.match(String(trend.publishedAt), /\d{2}:\d{2}/)
    assert.ok(trend.recommendation.length > 10)
    assert.ok(trend.media?.length >= 1)
  }
})

test('keeps decision metrics when a monitor refresh returns a sparse hotspot', () => {
  const state = normalizeGrowthState({ trends: [{ id: 'demo-live', title: 'The tiny rituals that make a weekday feel better', source: 'Local signal stream' }] })
  const refreshed = state.trends[0]
  assert.equal(refreshed.followers, '284K')
  assert.equal(refreshed.likeRate, '6.4%')
  assert.equal(refreshed.recommendation.length > 10, true)
})

test('classifies low-follower breakouts and high-follower quality hotspots from metrics', () => {
  const breakout = evaluateHotspot({ followers: '80K', likeRate: '8.2%', comments: '4.1K', views: '2.4M' })
  assert.ok(breakout.tags.includes('低粉爆款'))
  assert.equal(breakout.selectionLabel, '小号爆发，优先观察')

  const quality = evaluateHotspot({ followers: '1.2M', likeRate: '6.8%', comments: '22K', views: '4.1M' })
  assert.ok(quality.tags.includes('高粉高质量'))
  assert.equal(quality.selectionLabel, '高粉高质量，适合对标')
})

test('marks the seeded high-audience lifestyle hotspot as high quality', () => {
  const seeded = normalizeGrowthState({ trends: [{ title: 'The tiny rituals that make a weekday feel better' }] }).trends[0]
  assert.ok(seeded.tags.includes('高粉高质量'))
})

test('ranks hotspots by explainable score instead of capture order', () => {
  const ranked = rankHotspots([{ id: 'low', hotspotScore: 42 }, { id: 'high', hotspotScore: 91 }, { id: 'mid', relevance: 80 }])
  assert.deepEqual(ranked.map((item) => item.id), ['high', 'mid', 'low'])
})

test('checks X content quality with platform-specific rules and risk states', () => {
  const result = evaluateContentQuality({ text: 'How small teams use AI to ship faster? Here are three practical lessons.', metrics: { likes: 100, replies: 20, reposts: 10 }, author: { followers: 1000 } })
  assert.equal(result.status, '建议修改')
  assert.ok(result.checks.some((check) => check.id === 'hook' && check.status === '通过'))
  assert.ok(result.checks.some((check) => check.id === 'engagement' && check.status === '人工确认'))
  assert.ok(qualityRules.length >= 5)
})

test('assigns captured candidates to an account pool while preserving the global pool', async () => {
  const { createCandidateFromCapturedPost } = await import('../server/growthEngine.js')
  const state = normalizeGrowthState({ accounts: [{ id: 'acct-1', name: 'Lumen', category: 'lifestyle' }], candidatePool: [] })
  const next = createCandidateFromCapturedPost(state, { id: 'post-1', text: 'A practical daily ritual', sourceType: 'keyword', category: 'lifestyle', author: {}, metrics: {}, media: [] })
  assert.equal(next.candidatePool[0].accountId, 'acct-1')
  assert.equal(next.candidatePool[0].poolScope, 'account')
})

test('automatically routes a captured hotspot to the matching category account', () => {
  const state = normalizeGrowthState({
    accounts: [{ id: 'life', name: 'Lifestyle', category: 'lifestyle' }, { id: 'food', name: 'Food', category: 'food' }, { id: 'travel', name: 'Travel', category: 'travel' }],
    candidatePool: [],
  })
  const next = createCandidateFromCapturedPost(state, { id: 'food-post', text: 'Dinner post', category: 'food', categoryLabel: '美食餐饮', author: {}, metrics: {} })
  assert.equal(next.candidatePool[0].accountId, 'food')
  assert.equal(next.candidatePool[0].accountName, 'Food')
})

test('flags absolute claims for human confirmation', () => {
  const result = evaluateContentQuality({ text: 'This is the only guaranteed way to become rich.', metrics: {}, author: { followers: 50000 } })
  assert.equal(result.status, '人工确认')
  assert.ok(result.checks.some((check) => check.id === 'compliance' && check.status === '人工确认'))
})

test('provides original and Chinese interface copy for the language switch', () => {
  assert.equal(getInterfaceCopy('original').language, 'Language')
  assert.equal(getInterfaceCopy('zh').language, '界面语言')
  assert.equal(navLabels.original.dashboard.label, 'Overview')
  assert.equal(navLabels.zh.dashboard.label, '总仪表盘')
  assert.equal(uiText('EXECUTIVE OVERVIEW', 'zh'), '经营总览')
  assert.equal(uiText('EXECUTIVE OVERVIEW', 'original'), 'EXECUTIVE OVERVIEW')
})

test('assigns a captured candidate to an account and records status history', () => {
  const prepared = normalizeGrowthState({ accounts: [{ id: 'a', name: 'A' }], candidatePool: [] })
  const next = createCandidateFromCapturedPost(prepared, { id: 'post-1', text: 'Post', author: { followers: 100 }, metrics: {} }, 'a')
  assert.equal(next.candidatePool[0].accountId, 'a')
  assert.equal(next.candidatePool[0].status, '待拆解')
  assert.equal(next.candidatePool[0].statusHistory[0].status, '待拆解')
  assert.ok(candidateStatuses.includes('待发布'))
})

test('moves a candidate through valid content asset states and rejects invalid jumps', () => {
  const prepared = normalizeGrowthState({ accounts: [{ id: 'a', name: 'A' }], candidatePool: [{ id: 'c', accountId: 'a', status: '待拆解' }] })
  const started = transitionCandidate(prepared, 'c', '拆解中')
  assert.equal(started.candidatePool[0].status, '拆解中')
  assert.throws(() => transitionCandidate(started, 'c', '已发布'), /不允许/)
})

test('builds account and global candidate views from one asset list', () => {
  const state = normalizeGrowthState({ accounts: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], candidatePool: [{ id: 'one', accountId: 'a', status: '待拆解' }, { id: 'two', accountId: 'b', status: '待审核' }] })
  assert.equal(getCandidatesForAccount(state, 'a').length, 1)
  assert.equal(getCandidatesForAccount(state, 'all').length, 2)
})

test('creates a Chinese content asset with publish readiness fields', () => {
  const asset = createContentAsset({ candidateId: 'c', accountId: 'a', title: 'A useful post', originalText: 'A useful post with the original context.', source: '@creator', sourceMetrics: { impressions: 12000, likes: 800, replies: 40 }, tags: ['低粉爆款'] })
  assert.equal(asset.status, '待审核')
  assert.ok(asset.chineseTitle)
  assert.ok(asset.cta)
  assert.ok(asset.mediaBrief)
  assert.equal(asset.originalText, 'A useful post with the original context.')
  assert.equal(asset.source, '@creator')
  assert.equal(asset.sourceMetrics.impressions, 12000)
  assert.deepEqual(asset.tags, ['低粉爆款'])
  assert.match(asset.imagePrompt, /主体/)
  assert.match(asset.imagePrompt, /环境/)
  assert.match(asset.imagePrompt, /构图/)
  assert.match(asset.imagePrompt, /负面提示词/)
  assert.equal(asset.publishReadiness.complete, false)
})

test('applies a knowledge rule and records human review', () => {
  const state = normalizeGrowthState({ candidatePool: [{ id: 'c', status: '待审核', ruleReviews: [] }] })
  const checked = applyRuleReview(state, 'c', { ruleId: 'compliance', status: '人工确认', note: '检查收益承诺表达' })
  assert.equal(checked.candidatePool[0].ruleReviews[0].ruleId, 'compliance')
  assert.equal(checked.candidatePool[0].ruleReviews[0].note, '检查收益承诺表达')
})

test('assigns an unallocated candidate into an account pool and starts its workflow', () => {
  const state = normalizeGrowthState({ accounts: [{ id: 'a', name: 'A' }], candidatePool: [{ id: 'c', status: '待分配' }] })
  const assigned = assignCandidate(state, 'c', 'a')
  assert.equal(assigned.candidatePool[0].accountId, 'a')
  assert.equal(assigned.candidatePool[0].status, '待拆解')
})

test('requires complete publishing information before an approved asset can enter the publish queue', () => {
  const asset = createContentAsset({ id: 'asset-1', candidateId: 'c', accountId: 'a', title: 'Post' })
  const approved = transitionAsset(normalizeGrowthState({ assets: [asset] }), 'asset-1', '已确认')
  assert.throws(() => transitionAsset(approved, 'asset-1', '待发布'), /补齐账号、渠道、发布时间和素材决定/)
})

test('marks an approved asset ready after the operator provides schedule and media decision', () => {
  const asset = createContentAsset({ id: 'asset-ready', candidateId: 'c', accountId: 'a', title: 'Post' })
  const prepared = prepareAssetForPublish(normalizeGrowthState({ assets: [asset] }), 'asset-ready', { publishAt: '2026-09-03T19:30', mediaDecision: '使用 AI 图片 01' })
  assert.equal(prepared.assets[0].publishReadiness.complete, true)
  const approved = transitionAsset(prepared, 'asset-ready', '已确认')
  assert.equal(transitionAsset(approved, 'asset-ready', '待发布').assets[0].status, '待发布')
})

test('builds an explainable account health score with weighted dimensions', () => {
  const result = buildHealthScore({ healthBreakdown: { 内容表现: 80, 互动质量: 60, 粉丝增长: 70, 发布稳定: 90, 合规风险: 100 } })
  assert.equal(result.score, 77)
  assert.equal(result.dimensions.length, 5)
  assert.equal(result.dimensions.find((item) => item.label === '互动质量').weight, 25)
})

test('provides a health rule for every scoring dimension', () => {
  assert.equal(healthRules.length, 5)
  assert.deepEqual(healthRules.map((rule) => rule.label), ['内容表现', '互动质量', '粉丝增长', '发布稳定', '合规风险'])
  assert.ok(healthRules.every((rule) => rule.good && rule.warning && rule.action))
})

test('evaluates an X distribution draft with platform-specific checks and next actions', () => {
  const result = evaluateXDistribution({ text: 'You do not need a perfect plan. Try this small ritual tonight and tell me what changed.', followers: 10000, channel: 'X', publishHour: 19, hasMedia: false })
  assert.equal(result.channel, 'X')
  assert.ok(result.checks.some((check) => check.id === 'hook'))
  assert.ok(result.checks.some((check) => check.id === 'cta' && check.status === '通过'))
  assert.equal(result.nextAction, '补充素材并人工确认')
})

test('builds an account-specific intelligence snapshot without losing the global view', () => {
  const items = [{ accountId: 'a', category: 'lifestyle' }, { accountId: 'b', category: 'food' }]
  assert.equal(filterByAccount(items, 'all').length, 2)
  assert.equal(filterByAccount(items, 'a').length, 1)
  assert.equal(accountSnapshot({ id: 'a', category: 'lifestyle', health: 82 }, items, [{ category: 'lifestyle' }, { category: 'food' }]).candidateCount, 1)
})

test('evaluates platform-specific demo rules instead of applying one short-video rule set everywhere', () => {
  const x = evaluatePlatformRules('X', { text: 'Why does this small ritual work? Tell me what changed tonight.', hasMedia: false })
  const instagram = evaluatePlatformRules('Instagram', { text: '收藏这份清单：步骤一、步骤二。你呢？', hasMedia: true })
  assert.equal(platformRules.X.length, 3)
  assert.equal(x.channel, 'X')
  assert.equal(instagram.checks.find((item) => item.id === 'instagram-save').status, '通过')
  assert.equal(instagram.checks.find((item) => item.id === 'instagram-cover').status, '通过')
})

test('supports Xiaohongshu rules with search-oriented content guidance', () => {
  const result = evaluatePlatformRules('小红书', { text: '通勤早餐清单：3步做好一份低负担早餐，收藏起来下周照着做。', hasMedia: true })
  assert.equal(platformRules['小红书'].length, 4)
  assert.equal(result.channel, '小红书')
  assert.equal(result.checks.find((item) => item.id === 'xiaohongshu-title').status, '通过')
  assert.equal(result.checks.find((item) => item.id === 'xiaohongshu-save').status, '通过')
})

test('filters and sorts candidate content for an operator decision view', () => {
  const candidates = [{ id: 'a', accountId: 'one', status: '待拆解', tags: ['低粉爆款'], metrics: { likes: 900 } }, { id: 'b', accountId: 'one', status: '待审核', tags: ['评论驱动'], metrics: { likes: 1200 } }, { id: 'c', accountId: 'two', status: '待拆解', tags: ['低粉爆款'], metrics: { likes: 5000 } }]
  assert.deepEqual(filterCandidates(candidates, { accountId: 'one', tag: '低粉爆款', sortBy: 'likes' }).map((item) => item.id), ['a'])
  assert.deepEqual(filterCandidates(candidates, { accountId: 'all', sortBy: 'likes' }).map((item) => item.id), ['c', 'b', 'a'])
})

test('classifies useful comment intents and labels data reliability', () => {
  assert.equal(classifyCommentIntent('How do I make this?'), '求教程/步骤')
  assert.equal(classifyCommentIntent('Where is the link?'), '求链接/购买')
  assert.equal(getDataReliability('x-api', { impressions: 10 }).label, '真实数据')
  assert.equal(getDataReliability('x-api', {}).label, '部分真实')
})

test('generates a next-round experiment plan from a performance review', () => {
  const plan = buildExperimentPlan({ recommendation: '调整方向' }, { id: 'asset-1' })
  assert.equal(plan.goal, '提升内容互动效率')
  assert.equal(plan.sampleSize, 3)
  assert.ok(plan.metrics.includes('评论率'))
  assert.match(localTimeLabel('2026-09-03T19:30:00Z'), /\d{2}\/\d{2}/)
})

test('summarizes comment intent and preserves an actionable content signal', () => {
  const summary = summarizeCommentIntents(['Where is the link?', 'How do I make this?', 'Love this idea'])
  assert.equal(summary.total, 3)
  assert.equal(summary.topIntent, '求链接/购买')
  assert.equal(summary.items.find((item) => item.intent === '求教程/步骤').count, 1)
})

test('handles stored comment summaries without crashing state normalization', () => {
  const summary = summarizeCommentIntents({ topIntent: '求教程/步骤', total: 3, items: [] })
  assert.equal(summary.total, 0)
})

test('builds an auditable publish record with local time and operator', () => {
  const record = buildPublishRecord({ id: 'asset-1', channel: 'X', accountId: 'a', publishAt: '2026-09-03T19:30:00Z' }, { url: 'https://x.com/demo/1', operator: 'Content Ops', timeZone: 'Asia/Shanghai' })
  assert.equal(record.assetId, 'asset-1')
  assert.equal(record.operator, 'Content Ops')
  assert.equal(record.url, 'https://x.com/demo/1')
  assert.equal(record.versionLabel, 'V1 AI 初稿')
  assert.equal(record.mediaDecision, '未记录')
  assert.match(record.localTime, /09\/04|09\/03/)
})

test('exposes platform goals and metadata alongside executable rules', () => {
  const brief = getPlatformBrief('小红书')
  assert.equal(brief.goal, '搜索、收藏、评论与经验可信度')
  assert.equal(brief.contentTypes.includes('攻略'), true)
  const result = evaluatePlatformRules('小红书', { text: '通勤早餐清单：3步做好低负担早餐', hasMedia: true })
  assert.equal(result.brief.riskLevel, '高')
  assert.equal(result.checks[0].manualReview, true)
})

test('checks overseas disclosure, claims, privacy, and media rights before publishing', () => {
  const result = evaluateComplianceRules({ text: 'Sponsored: this supplement guarantees results. DM me your phone number.', hasMedia: true, hasAffiliate: true, hasDisclosure: false, hasMediaRights: false })
  assert.equal(result.status, '人工确认')
  assert.ok(result.checks.some((item) => item.id === 'disclosure' && item.status === '人工确认'))
  assert.ok(result.checks.some((item) => item.id === 'claims' && item.status === '人工确认'))
  assert.ok(result.checks.some((item) => item.id === 'privacy' && item.status === '人工确认'))
})

test('recalculates account health from a history of published outcomes', () => {
  const summary = buildAccountPerformanceSummary([
    { actual: { impressions: 10000, likeRate: 7, commentRate: 0.5, followersDelta: 30 }, review: { verdict: '达到预期' } },
    { actual: { impressions: 12000, likeRate: 3, commentRate: 0.1, followersDelta: -10 }, review: { verdict: '未达到预期' } },
  ])
  assert.equal(summary.sampleSize, 2)
  assert.equal(summary.trend, '需要优化')
  assert.ok(summary.dimensions['互动质量'] < 80)
})

test('converts candidate signals into an explicit next action and asset threshold', () => {
  const result = getCandidateRecommendation({ tags: ['低粉爆款', '高匹配', '高点赞率'], categoryLabel: '美食餐饮' })
  assert.equal(result.action, '立即进入爆款拆解')
  assert.equal(result.assetReady, true)
  assert.match(result.reason, /低粉爆款/)
})

test('aggregates published outcomes for cross-content operating decisions', () => {
  const result = buildPerformancePortfolio([
    { accountId: 'a', channel: 'X', tags: ['评论驱动'], performance: { actual: { impressions: 1000, likes: 100, comments: 20, followersDelta: 8 } } },
    { accountId: 'a', channel: 'X', tags: ['低粉爆款'], performance: { actual: { impressions: 2000, likes: 100, comments: 10, followersDelta: -2 } } },
  ])
  assert.equal(result.sampleSize, 2)
  assert.equal(result.byChannel.X.posts, 2)
  assert.equal(result.byTag['评论驱动'].commentRate, 2)
  assert.equal(result.bestDimension, '评论驱动')
})

test('builds a full-funnel growth view with conversion rates and decision signals', () => {
  const funnel = buildAcquisitionFunnel({ visits: 1000, signups: 180, activated: 90, retained: 36, paid: 9 })
  assert.equal(funnel.stages.find((item) => item.key === 'activated').rate, 50)
  assert.equal(funnel.stages.find((item) => item.key === 'paid').rate, 0.9)
  assert.equal(funnel.primaryBottleneck, '留存')
})

test('returns market playbooks and a measurable KOL pipeline for overseas growth', () => {
  const markets = buildMarketPlaybook()
  assert.deepEqual(markets.map((item) => item.key), ['北美', '欧洲', '东南亚', '日韩'])
  assert.ok(markets.every((item) => item.platforms.length && item.contentAngle && item.compliance))
  const kol = buildKOLPipeline()
  assert.equal(kol.total, 4)
  assert.ok(kol.byStage['已合作'])
})

test('attributes content outcomes to channel and market without fabricating missing data', () => {
  const result = buildGrowthAttribution([{ channel: 'X', market: '北美', campaign: 'AI workflow', performance: { actual: { impressions: 10000, likes: 500, comments: 100, followersDelta: 20 } } }])
  assert.equal(result.rows[0].signupRate, null)
  assert.equal(result.rows[0].engagementRate, 6)
  assert.equal(result.note, '注册、激活和付费数据需要产品埋点接入后计算')
})

test('creates version entries and an account operating profile for review decisions', () => {
  const version = buildVersionEntry({ label: 'V2 运营修改', body: 'new copy', operator: '运营负责人' })
  assert.equal(version.label, 'V2 运营修改')
  assert.ok(version.createdAt)
  const profile = getAccountOperatingProfile({ name: 'A', categoryLabel: '生活方式', targetAudience: '北美城市职场人', contentPillars: ['日常习惯'], contentGuardrails: ['不夸大效果'], timeZone: 'America/Los_Angeles' })
  assert.equal(profile.targetAudience, '北美城市职场人')
  assert.deepEqual(profile.contentPillars, ['日常习惯'])
  assert.equal(profile.timeZone, 'America/Los_Angeles')
})

test('records published metrics and generates an explainable performance review', () => {
  const state = normalizeGrowthState({
    accounts: [{ id: 'a', name: 'A', health: 80 }],
    assets: [{ id: 'asset-1', accountId: 'a', status: '已发布', publishAt: '2026-09-01T19:30', expected: { impressions: 10000, likeRate: 5, comments: 100 }, tags: ['评论驱动'] }],
  })
  const reviewed = recordPublishedPerformance(state, 'asset-1', { impressions: 14000, likes: 980, comments: 180, reposts: 70, followersDelta: 120 })
  const asset = reviewed.assets[0]
  assert.equal(asset.performance.actual.impressions, 14000)
  assert.equal(asset.performance.actual.likeRate, 7)
  assert.equal(asset.performance.review.verdict, '达到预期')
  assert.equal(asset.performance.review.recommendation, '继续复用')
  assert.ok(asset.performance.review.ruleFeedback.some((item) => item.rule === '评论驱动'))
  assert.ok(reviewed.activity[0].text.includes('发布后数据已回流'))
  assert.equal(reviewed.accounts[0].performanceFeedback.lastAssetId, 'asset-1')
  assert.ok(reviewed.accounts[0].health >= 80)
})

test('records a publish timestamp and link when an asset is marked published', () => {
  const asset = createContentAsset({ id: 'asset-publish', accountId: 'a', publishAt: '2026-09-03T19:30', media: [{ type: 'photo' }] })
  const ready = prepareAssetForPublish(normalizeGrowthState({ accounts: [{ id: 'a', name: 'A' }], assets: [asset] }), 'asset-publish', { publishAt: '2026-09-03T19:30', mediaDecision: '使用图片' , publishUrl: 'https://x.com/demo/status/1' })
  const approved = transitionAsset(ready, 'asset-publish', '已确认')
  const published = transitionAsset(approved, 'asset-publish', '待发布')
  const done = transitionAsset(published, 'asset-publish', '已发布')
  assert.ok(done.assets[0].publishedAt)
  assert.equal(done.assets[0].publishUrl, 'https://x.com/demo/status/1')
})

test('marks a post for direction adjustment when exposure is high but interaction is weak', () => {
  const state = normalizeGrowthState({ assets: [{ id: 'asset-2', status: '已发布', expected: { impressions: 10000, likeRate: 5, comments: 100 } }] })
  const reviewed = recordPublishedPerformance(state, 'asset-2', { impressions: 18000, likes: 360, comments: 20 })
  assert.equal(reviewed.assets[0].performance.review.verdict, '未达到预期')
  assert.equal(reviewed.assets[0].performance.review.recommendation, '调整方向')
})
