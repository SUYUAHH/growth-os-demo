const ratio = (value, base) => base > 0 ? Number((value / base * 100).toFixed(1)) : 0

export function buildAcquisitionFunnel(input = {}) {
  const values = { visits: Number(input.visits || 0), signups: Number(input.signups || 0), activated: Number(input.activated || 0), retained: Number(input.retained || 0), paid: Number(input.paid || 0) }
  const stages = [
    { key: 'visits', label: '内容触达 / 访问', value: values.visits, rate: 100 },
    { key: 'signups', label: '注册', value: values.signups, rate: ratio(values.signups, values.visits) },
    { key: 'activated', label: '首次激活', value: values.activated, rate: ratio(values.activated, values.signups) },
    { key: 'retained', label: 'D7 留存', value: values.retained, rate: ratio(values.retained, values.activated) },
    { key: 'paid', label: '付费', value: values.paid, rate: ratio(values.paid, values.visits) },
  ]
  const postSignup = stages.filter((item) => ['activated', 'retained'].includes(item.key))
  const primaryBottleneck = postSignup.sort((left, right) => left.rate - right.rate)[0]?.label.replace('D7 ', '') || '暂无数据'
  return { stages, primaryBottleneck }
}

export function buildMarketPlaybook() {
  return [
    { key: '北美', platforms: ['X', 'Reddit', 'TikTok'], contentAngle: '效率、真实案例、明确观点', compliance: '广告披露、隐私和效果声明', activation: '免费体验后完成第一个 AI 工作流' },
    { key: '欧洲', platforms: ['LinkedIn', 'X', 'YouTube'], contentAngle: '可信度、隐私、安全与专业解释', compliance: 'GDPR、广告披露、版权', activation: '行业模板与数据处理说明' },
    { key: '东南亚', platforms: ['TikTok', 'Instagram', 'Facebook Group'], contentAngle: '低门槛教程、场景演示、社区口碑', compliance: '本地语言、促销表述、支付预期', activation: '移动端快速上手与邀请奖励' },
    { key: '日韩', platforms: ['X', 'YouTube', 'Instagram'], contentAngle: '细节、审美、可信赖的产品教育', compliance: '本地化表达、肖像/音乐版权、夸大宣传', activation: '高完成度案例与客服指引' },
  ]
}

export function buildKOLPipeline() {
  const items = [
    { id: 'kol-1', name: 'AI Finance Brief', market: '北美', tier: '腰部', stage: '已合作', followers: 182000, expectedReach: 42000, goal: '产品教育与注册' },
    { id: 'kol-2', name: 'Future of Work Club', market: '欧洲', tier: '社区节点', stage: '待沟通', followers: 64000, expectedReach: 16000, goal: '行业信任与试用' },
    { id: 'kol-3', name: 'Build with AI SEA', market: '东南亚', tier: '长尾', stage: '内容共创', followers: 38000, expectedReach: 11000, goal: '教程裂变与激活' },
    { id: 'kol-4', name: 'AI Product Notes JP', market: '日韩', tier: '腰部', stage: '评估中', followers: 97000, expectedReach: 23000, goal: '本地化产品教育' },
  ]
  const byStage = Object.fromEntries([...new Set(items.map((item) => item.stage))].map((stage) => [stage, items.filter((item) => item.stage === stage).length]))
  return { total: items.length, items, byStage }
}

export function buildGrowthAttribution(items = []) {
  const rows = items.map((item) => {
    const actual = item.performance?.actual || {}
    const impressions = Number(actual.impressions || 0)
    const engagementRate = impressions ? Number(((Number(actual.likes || 0) + Number(actual.comments || 0)) / impressions * 100).toFixed(1)) : null
    return { channel: item.channel || '未知渠道', market: item.market || '未标注市场', campaign: item.campaign || item.title || '未命名活动', impressions, engagementRate, signups: actual.signups ?? null, signupRate: actual.signups !== undefined && impressions ? ratio(actual.signups, impressions) : null, activated: actual.activated ?? null, paid: actual.paid ?? null }
  })
  return { rows, note: '注册、激活和付费数据需要产品埋点接入后计算' }
}
