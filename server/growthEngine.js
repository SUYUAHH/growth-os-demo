const priorityWeight = { P0: 0, P1: 1, P2: 2 }

const defaultStrategies = [
  {
    id: 'tuesday-night-test',
    benchmark: 'Everyday Motion',
    title: '周二晚上测试：下班后的车，才是真实的车',
    mechanism: '高频工作日场景 + 困扰到轻松的情绪转折',
    reusable: '先呈现用户在压力场景下的判断，再用一个功能细节兑现它。',
    avoid: '不复制对标账号的固定人设、原句和“quiet luxury”标签。',
    expressionSimilarity: 18,
    mechanismSimilarity: 42,
    risk: '低',
    status: '可进入候选池',
  },
  {
    id: 'calm-luxury-copy',
    benchmark: 'Drive with Maya',
    title: '安静就是新的豪华',
    mechanism: '情绪化豪华叙事',
    reusable: '把抽象感受落到日常细节。',
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
  const issues = Array.isArray(account.issues) && account.issues.length ? account.issues.slice(0, 3) : [issueFor(account)]
  return { ...account, issues, metrics: account.metrics || demoAccountMetrics[index % demoAccountMetrics.length] }
}

export function normalizeGrowthState(state) {
  const accounts = (state.accounts || []).map(normalizedAccount)
  return {
    ...state,
    accounts,
    candidatePool: state.candidatePool || [],
    activity: state.activity || [],
    leaderTasks: state.leaderTasks || [],
    dailyReports: state.dailyReports || [],
    benchmarkStrategies: state.benchmarkStrategies?.length ? state.benchmarkStrategies : defaultStrategies,
  }
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
    status: '待分析',
    addedAt: now(),
    mechanismSimilarity: strategy.mechanismSimilarity,
    expressionSimilarity: strategy.expressionSimilarity,
  }
  return { ...prepared, candidatePool: [candidate, ...prepared.candidatePool.filter((item) => item.id !== candidate.id)].slice(0, 30), activity: [activity(`对标策略已进入候选池：${strategy.title}`, 'insight'), ...prepared.activity].slice(0, 30) }
}
