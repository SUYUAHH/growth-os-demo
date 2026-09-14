const objectiveRules = {
  '互动': {
    strategy: '小预算 · 24–48 小时 · 1 个受众包',
    success: '目标用户互动率 ≥ 自然基线 × 1.2，且评论意图不下降',
    track: '互动率、有效评论占比、负面评论率、频次',
  },
  '网站访问': {
    strategy: '小预算 · 24–48 小时 · 单一落地页',
    success: 'CTR ≥ 自然基线 × 1.2，且落地页访问率和停留达标',
    track: 'CTR、CPC、落地页访问率、有效停留、UTM 来源',
  },
  '注册转化': {
    strategy: '小预算 · 48 小时 · 单一转化事件',
    success: '注册转化率不低于自然基线，获客成本在业务上限内',
    track: '注册转化率、CPA、事件完成率、转化漏斗流失',
  },
  '线索收集': {
    strategy: '小预算 · 48 小时 · 先验证线索质量',
    success: '有效线索率达标，CPL 在业务上限内且目标人群占比不下降',
    track: '有效线索率、CPL、目标用户占比、销售回传状态',
  },
}

const paidRiskPattern = /敏感|争议|版权|异常|投流风险|合规/

export function parseMetric(value) {
  const match = String(value || '').trim().replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i)
  if (!match) return 0
  const multiplier = { K: 1e3, M: 1e6, B: 1e9 }[String(match[2] || '').toUpperCase()] || 1
  return Number(match[1]) * multiplier
}

export function formatMetric(value) {
  if (!value) return '—'
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return Math.round(value).toLocaleString('zh-CN')
}

export function getPaidObjectiveRule(objective = '互动') {
  return objectiveRules[objective] || objectiveRules['互动']
}

export function evaluatePaidReadiness(trend = {}, naturalTested = false) {
  const followers = parseMetric(trend.followers)
  const engagement = Number(String(trend.likeRate || '').replace('%', '')) || 0
  const comments = parseMetric(trend.comments)
  const views = parseMetric(trend.views)
  const commentRate = views ? comments / views * 100 : 0
  const tags = trend.tags || []
  const missingData = [
    !followers && '粉丝量',
    !engagement && '点赞率',
    !views && '曝光量',
    !comments && '评论量',
    !naturalTested && '自然测试结果',
  ].filter(Boolean)
  const evidence = [
    `粉丝量 ${trend.followers || '—'}，用于判断账号体量影响`,
    `曝光 ${trend.views || '—'}，用于计算评论率和自然基线`,
    `点赞率 ${trend.likeRate || '—'}，仅作为内容兴趣信号`,
    `评论率 ${views ? `${commentRate.toFixed(2)}%` : '—'}，还需人工确认评论意图`,
  ]
  const testPlan = {
    budgetCap: '¥100–300（内部演示上限）',
    window: '24–48 小时',
    audience: '单一目标受众包，避免受众与变量混杂',
    variable: '一次只验证一个变量：受众或文案，不同时改动',
    stopConditions: ['负面评论率明显高于自然基线', '频次上升但有效互动和目标行为下降', '发现版权、事实或异常流量证据'],
  }
  const riskHit = tags.some((tag) => paidRiskPattern.test(tag))
  const base = { followers, engagement, comments, views, commentRate, evidence, missingData, testPlan, manualReview: true }

  if (riskHit) return { ...base, decision: '禁止投流', tone: 'paid-stop', reason: '命中风险标签，先完成事实、版权和平台合规核验。', confidence: '高', gate: '风险前置拦截', canApply: false }
  if (!followers || !engagement || !views) return { ...base, decision: '人工补数后再判', tone: 'paid-review', reason: '缺少粉丝量、点赞率或曝光基线，不能用结果指标直接申请预算。', confidence: '低', gate: '数据完整性门槛', canApply: false }
  if (!naturalTested) return { ...base, decision: '先自然测试', tone: 'paid-test', reason: '先观察自然流量下的互动质量和目标用户意图，再判断是否值得付费放大。', confidence: '中', gate: '自然增长优先', canApply: false }
  if (engagement >= 4 && commentRate >= 0.12) return { ...base, decision: '人工审核后小预算', tone: 'paid-review', reason: '互动效率和评论意图达到内部测试线，但仍需确认目标用户与自然流量质量。', confidence: '中', gate: '人工审核后放大', canApply: true }
  return { ...base, decision: '暂不建议投流', tone: 'paid-stop', reason: '当前数据没有证明内容在自然流量下成立，投流可能放大错误归因。', confidence: '中', gate: '先补内容验证', canApply: false }
}
