import { useMemo, useState } from 'react'
import { AlertTriangle, Ban, Check, CheckCircle2, CircleHelp, DollarSign, Flag, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { evaluatePaidReadiness, formatMetric, getPaidObjectiveRule, parseMetric } from '../lib/paidDistributionRules'

function buildChecks(trend, naturalTested) {
  const result = evaluatePaidReadiness(trend, naturalTested)
  const { engagement, commentRate, views } = result
  const tags = trend?.tags || []
  const hasRisk = tags.some((tag) => /敏感|争议|版权|异常|投流风险|合规/.test(tag))
  return [
    { id: 'policy', label: '内容安全与真实性', detail: hasRisk ? '命中敏感、争议、版权或异常流量标签。' : '未命中 Demo 风险标签；仍需人工核验事实和表达。', status: hasRisk ? '阻断' : '待确认', icon: hasRisk ? <Ban size={13} /> : <ShieldCheck size={13} /> },
    { id: 'signal', label: '自然增长信号', detail: naturalTested ? '已标记为完成人工自然测试，可进入小预算评估。' : `点赞率 ${engagement ? `${engagement.toFixed(1)}%` : '—'}，先验证非付费表现。`, status: naturalTested ? '通过' : '待验证', icon: naturalTested ? <Check size={13} /> : <CircleHelp size={13} /> },
    { id: 'intent', label: '目标用户意图', detail: views ? `评论率 ${commentRate.toFixed(2)}%，需要继续看评论是否来自目标人群。` : '缺少曝光和评论数据，无法计算评论意图。', status: views && commentRate >= 0.12 ? '达到测试线' : '待补证据', icon: views && commentRate >= 0.12 ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} /> },
    { id: 'tracking', label: '归因与投后追踪', detail: '需要绑定 UTM、落地页事件和平台消耗，区分曝光、点击与有效转化。', status: '必须补齐', icon: <Flag size={13} /> },
  ]
}

export default function PaidDistributionDecision({ trend }) {
  const [naturalTested, setNaturalTested] = useState(false)
  const [objective, setObjective] = useState('互动')
  const [showDetails, setShowDetails] = useState(false)
  const [applicationCreated, setApplicationCreated] = useState(false)
  const [postTest, setPostTest] = useState(null)
  const result = useMemo(() => evaluatePaidReadiness(trend, naturalTested), [trend, naturalTested])
  const checks = useMemo(() => buildChecks(trend, naturalTested), [trend, naturalTested])
  const objectiveRule = getPaidObjectiveRule(objective)
  const followers = parseMetric(trend?.followers)
  const views = parseMetric(trend?.views)
  const commentRate = views ? `${(evaluatePaidReadiness(trend, naturalTested).commentRate).toFixed(2)}%` : '—'
  const xPlatform = trend?.platform || 'X'
  const postTestResult = postTest || { label: '尚未录入', tone: 'pending', detail: '先创建小预算申请单，再录入投后样本验证增量。' }

  function createApplication() {
    if (!result.canApply) return
    setApplicationCreated(true)
    setPostTest(null)
  }

  function recordPostTest() {
    const demo = objective === '互动'
      ? { label: '保留并扩大样本', tone: 'pass', detail: '互动成本和有效评论质量达到测试线，可在同一受众包内小幅扩大。', cpm: '¥18.6', ctr: '2.8%', cpc: '¥0.66', guardrail: '负面评论率 1.4% · 账号健康稳定' }
      : objective === '网站访问'
        ? { label: '保留并继续验证', tone: 'pass', detail: 'CTR 高于自然基线，继续观察落地页有效停留和后续转化。', cpm: '¥21.2', ctr: '1.9%', cpc: '¥1.12', guardrail: '落地页有效停留 64% · 频次可控' }
        : { label: '补充转化数据', tone: 'review', detail: '已有点击信号，但样本量不足以判断注册或线索质量，暂不扩大预算。', cpm: '¥24.8', ctr: '1.3%', cpc: '¥1.91', guardrail: '转化事件回传不足 · 暂停自动扩量' }
    setPostTest(demo)
  }

  return <section className="section-block paid-decision-block">
    <div className="paid-decision-head">
      <div><span className="eyebrow"><DollarSign size={14} /> {xPlatform} PAID DISTRIBUTION GATE</span><h2>这条内容是否适合投流？</h2><p>先证明自然增长，再用小预算验证增量；规则只辅助决策，不自动提交广告。</p></div>
      <span className={`paid-decision-badge ${result.tone}`}>{result.icon}{result.decision}</span>
    </div>

    <div className="paid-decision-summary">
      <div><span className="pair-label">当前闸门 · {result.gate}</span><strong>{result.decision}</strong><p>{result.reason}</p><small className="paid-confidence">判断置信度：{result.confidence}</small></div>
      <div><span className="pair-label">为什么不是直接投？</span><strong>避免放大错误归因</strong><p>热点、大 V、账号体量或异常流量都可能让表面数据变好，必须先看自然样本和目标用户行为。</p></div>
      <div><span className="pair-label">下一步动作</span><strong>{result.canApply ? '人工审核后申请小预算' : result.decision === '先自然测试' ? '先完成自然测试' : '暂不创建预算'}</strong><p>{result.canApply ? '保留人工确认，确认素材、受众、预算和落地页后再提交。' : result.decision === '先自然测试' ? '系统不会直接发布或开预算，先补足自然样本。' : '先补数据或改写内容，不用预算掩盖内容问题。'}</p></div>
    </div>

    <div className="paid-check-grid">{checks.map((check) => <div className={`paid-check-card paid-check-${check.status === '通过' ? 'pass' : check.status === '阻断' ? 'stop' : 'review'}`} key={check.id}><span className="paid-check-icon">{check.icon}</span><div><strong>{check.label}</strong><p>{check.detail}</p></div><b>{check.status}</b></div>)}</div>

    <div className="paid-rule-grid">
      <div><span className="pair-label">输入数据 · 结果层</span><ul><li>粉丝量 {trend?.followers || '—'}：解析为 {formatMetric(followers)}</li><li>曝光 {trend?.views || '—'}：用于计算互动效率基线</li><li>点赞率 {trend?.likeRate || '—'}：不等于转化质量</li><li>评论率 {commentRate}：需人工判断评论意图</li></ul></div>
      <div><span className="pair-label">投流前 · 三道门</span><ul><li>安全门：事实、版权、敏感事件、夸大承诺</li><li>自然门：先看自然互动、评论质量、主页访问</li><li>归因门：补齐 UTM、转化事件和消耗数据</li><li>任一门未通过，不进入预算申请</li></ul></div>
      <div><span className="pair-label">投流后 · 验证增量</span><ul><li>一级：CPM、CTR、CPC、有效曝光</li><li>二级：主页访问率、目标用户评论占比</li><li>结果：关注成本、注册/留资成本、转化率</li><li>护栏：负面评论率、频次、账号健康变化</li></ul></div>
    </div>

    <div className="paid-test-panel"><div className="paid-test-head"><div><span className="pair-label"><SlidersHorizontal size={13} /> 投流测试单 · Demo</span><strong>只放大已验证的内容机制</strong><p>内部示例：小额、短周期、单变量测试，不把一次结果直接当成长期结论。</p></div><button className={naturalTested ? 'paid-action-button paid-action-done' : 'paid-action-button'} onClick={() => { setNaturalTested((value) => !value); setApplicationCreated(false); setPostTest(null) }}><CheckCircle2 size={14} />{naturalTested ? '已完成自然测试标记' : '标记已完成自然测试'}</button></div><div className="paid-test-controls"><label>投流目标<select value={objective} onChange={(event) => { setObjective(event.target.value); setPostTest(null) }}><option>互动</option><option>网站访问</option><option>注册转化</option><option>线索收集</option></select></label><div><span>建议策略</span><b>{result.canApply ? `${objective} · ${objectiveRule.strategy}` : '暂不创建预算，先完成前置验证'}</b></div><div><span>成功标准</span><b>{result.canApply ? objectiveRule.success : '自然样本互动质量、评论意图和风险检查通过'}</b></div></div><div className="paid-objective-note"><span>投后必须追踪</span><strong>{objectiveRule.track}</strong></div>{result.canApply && <div className="paid-application-row"><div><span className="pair-label">执行状态</span><strong>{applicationCreated ? '待负责人审批 · 未提交平台' : '未创建申请单'}</strong><small>{applicationCreated ? '已锁定目标、测试窗口和验收指标，下一步由人工确认预算与受众。' : '自然测试通过后，生成内部申请单，不会直接调用 X Ads。'}</small></div><button className={applicationCreated ? 'paid-action-button paid-action-done' : 'paid-action-button'} onClick={createApplication} disabled={applicationCreated}><CheckCircle2 size={14} />{applicationCreated ? '申请单已生成' : '生成小预算申请单'}</button></div>}{applicationCreated && <div className="paid-post-test"><div className="paid-post-test-head"><div><span className="pair-label">投后验证 · 模拟回传</span><strong>验证增量，而不是只看曝光</strong><small>Demo 样本用于展示闭环，真实接入后由平台数据和业务事件回传。</small></div><button className="paid-action-button" onClick={recordPostTest}><Flag size={14} />录入一轮投后样本</button></div><div className="paid-post-status"><span className={`paid-post-badge paid-post-${postTestResult.tone}`}>{postTestResult.label}</span><p>{postTestResult.detail}</p></div>{postTest && <div className="paid-post-metrics"><span><b>{postTest.cpm}</b><small>CPM</small></span><span><b>{postTest.ctr}</b><small>CTR</small></span><span><b>{postTest.cpc}</b><small>CPC</small></span><span><b>{postTest.guardrail}</b><small>护栏指标</small></span></div>}</div>}</div>

    <div className="paid-footer"><span><AlertTriangle size={14} />X Ads 具体资格、审核和投放结果以平台当时规则为准；这里是企业内部的决策演示。</span><button className="paid-details-button" onClick={() => setShowDetails((value) => !value)}>{showDetails ? '收起规则说明' : '查看人工边界'}</button></div>
    {showDetails && <div className="paid-boundary"><strong>必须人工确认</strong><span>疑似热点借势、敏感或争议话题、版权不明素材、异常互动、品牌调性、事实准确性、受众与账号长期定位不匹配。</span><strong>禁止自动动作</strong><span>系统不自动提交预算、不自动发布、不根据一次爆款结果承诺 ROI；人工确认记录需要保留在审核队列。</span></div>}
  </section>
}
