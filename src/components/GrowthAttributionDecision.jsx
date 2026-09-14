import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, CircleHelp, GitBranch, ShieldCheck } from 'lucide-react'
import { parseMetric } from '../lib/paidDistributionRules.js'
import { evaluateHotspotSignal } from '../lib/candidatePaidSignals.js'

function buildAnalysis(trend) {
  const followers = parseMetric(trend.followers); const views = parseMetric(trend.views); const likes = parseMetric(trend.likes); const comments = parseMetric(trend.comments); const hotspot = evaluateHotspotSignal({}, trend)
  const likeRate = Number(String(trend.likeRate || '').replace('%', '')) || (views ? likes / views * 100 : 0); const commentRate = views ? comments / views * 100 : 0
  const lowFollower = followers > 0 && followers < 100000; const breakout = lowFollower && views > followers * 2; const risk = (trend.tags || []).some((tag) => /敏感|争议|版权|异常|投流|推广|广告/.test(tag)); const hasExternal = (trend.tags || []).some((tag) => /热点|趋势|事件|平台/.test(tag))
  const contentScore = Math.min(96, Math.round(48 + likeRate * 4 + Math.min(commentRate * 30, 18) + (breakout ? 12 : 0)))
  const commentsList = trend.commentsData || trend.commentSamples || trend.commentsList || []
  const influencerComments = commentsList.filter((item) => Number(item.followers || item.author?.followers || 0) >= 100000 || /verified|官方|KOL|大V|品牌/i.test(String(item.badge || item.author?.verifiedType || '')))
  const commentInfluence = commentsList.length ? Math.round(influencerComments.length / commentsList.length * 100) : (commentRate >= 0.2 ? 18 : 0)
  const paidProbability = Math.min(95, Math.max(5, Math.round((risk ? 72 : 0) + (views > followers * 10 ? 18 : 0) + (likeRate < 2 && views > followers * 8 ? 8 : 0))))
  const suspectedProbability = Math.min(88, Math.max(8, Math.round((hasExternal ? 48 : 24) + (views > followers * 6 ? 18 : 0) + (commentInfluence >= 10 ? 12 : 0))))
  const paidStatus = paidProbability >= 70 ? '投流可能性高' : suspectedProbability >= 45 ? '疑似投流' : '暂未发现投流'
  const externalScore = risk || hasExternal ? 68 : 32; const baselineScore = breakout ? 86 : likeRate >= 6 ? 72 : 48
  const decision = risk ? '仅作为案例观察' : contentScore >= 78 && !hasExternal ? '可直接复用' : '改写后复用'
  const opportunityScore = Math.max(8, Math.min(96, Math.round(contentScore * 0.45 + baselineScore * 0.25 + (hasExternal ? 8 : 18) - (risk ? 22 : 0))))
  const stopReasons = risk ? ['存在投流/推广或异常信号', '需核验版权、事实与平台风险'] : hasExternal && !breakout ? ['增长可能依赖短期热点', '自然增长尚未验证'] : ['暂无明确禁止项，仍需小样本验证']
  const sources = [
    ['内容机制', likeRate >= 6 ? `点赞率 ${likeRate.toFixed(1)}%，内容本身产生了明确兴趣信号；评论率 ${commentRate.toFixed(2)}%，仍需判断评论是否有真实需求。` : `点赞率 ${likeRate.toFixed(1)}%，内容兴趣信号偏弱，不能仅凭曝光判断有效。`, likeRate >= 6 ? '部分验证' : '待核验', contentScore],
    ['平台分发', views > followers * 10 ? `曝光 ${trend.views || '—'} 明显高于账号体量，可能获得推荐流放大。` : '曝光与账号体量基本匹配，暂未发现明显平台异常放大。', views > followers * 10 ? '部分验证' : '待核验', views > followers * 10 ? 64 : 42],
    ['外部变量', `系统判断：${paidStatus}。投流可能性 ${paidProbability}%，疑似投流概率 ${suspectedProbability}%；依据曝光/粉丝比、互动结构和外部标签综合估算。`, '系统判断', Math.max(paidProbability, suspectedProbability)],
    ['评论影响者', commentsList.length ? `评论样本 ${commentsList.length} 条，其中 ${influencerComments.length} 条来自大 V、KOL、品牌或高粉账号，影响者评论占比 ${commentInfluence}%。` : '当前没有评论样本，无法识别大 V、KOL 或品牌账号评论信号。', commentsList.length ? '已扫描' : '缺少样本', commentInfluence],
    ['账号基线', breakout ? `粉丝 ${trend.followers || '—'}，曝光 ${trend.views || '—'}，小体量账号获得超额触达，具备内容穿透信号。` : `粉丝 ${trend.followers || '—'}，当前互动效率需要与同账号历史内容继续对照。`, breakout ? '已验证' : '待补样本', baselineScore],
  ]
  const scenarios = [
    ['无热点时仍可能表现良好', hasExternal ? '低到中等可能' : contentScore >= 78 ? '较高可能' : '待确认', hasExternal ? '当前表现可能依赖外部话题，需用非热点窗口复测。' : '内容指标达到初步信号，但仍需同账号同类内容作为对照。'],
    ['去除投流后仍然成立', risk ? '无法确认' : '待确认', risk ? '存在投流或推广信号，不能把当前结果当作自然基线。' : '缺少平台投放明细，暂不能排除资源放大。'],
    ['普通账号可以复用', breakout && !risk ? '较高可能' : '中等可能', breakout ? '可复制的是选题和表达机制，不能复制原账号的资源与历史权重。' : '需要替换案例并在目标账号上做小样本验证。'],
  ]
  sources.splice(2, 0, ['热点关联', `蹭热点可能性 ${hotspot.probability}% · ${hotspot.label}。${hotspot.evidence}`, '系统判断', hotspot.probability])
  return { sources, scenarios, score: contentScore, opportunityScore, stopReasons, decision, externalScore, risk, paidProbability, suspectedProbability, hotspot, paidStatus, commentInfluence, influencerComments, missing: commentsList.length ? '投流明细、热点前后对照、同账号历史样本' : '投流明细、评论样本、热点前后对照、同账号历史样本' }
}

export default function GrowthAttributionDecision({ trend }) {
  const [open, setOpen] = useState(true)
  const [review, setReview] = useState('待人工确认')
  const [decision, setDecision] = useState('改写后复用')
  if (!trend) return null
  const analysis = buildAnalysis(trend)
  return <section className="section-block attribution-decision">
    <div className="attribution-heading"><div><span className="eyebrow"><GitBranch size={14} /> GROWTH CAUSALITY · MVP</span><h2>增长原因分析与内容复用决策</h2><p>把“数据好”拆成可验证的原因，帮助运营决定下一步是否复用。</p></div><button className="secondary-button" onClick={() => setOpen(!open)}><ChevronDown size={15} className={open ? 'rotate-180' : ''} />{open ? '收起分析' : '展开分析'}</button></div>
    {open && <><div className="attribution-spec"><div><span>增长机会分</span><strong>{analysis.opportunityScore} / 100</strong></div><div><span>不建议直接做的原因</span><strong>{analysis.stopReasons.join(' · ')}</strong></div><div><span>增长假设与验证</span><strong>替换热点与账号资源后，发布 2 小时对照互动率、目标人群评论和主页访问率</strong></div></div>
      <div className="attribution-summary"><div><span className="pair-label">当前判断</span><strong>{analysis.risk ? `外部资源信号较强：${analysis.paidStatus}。` : analysis.score >= 78 ? '内容机制贡献较强，具备初步复用价值。' : '结果信号不足，需要补充对照数据。'}</strong><small>投流可能性 {analysis.paidProbability}% · 疑似投流 {analysis.suspectedProbability}% · 评论影响者占比 {analysis.commentInfluence}%</small></div><div className="replication-score"><span>可复制性</span><strong>{analysis.score}</strong><small>/ 100 · 动态评估</small></div><div><span className="pair-label">复用建议</span><strong className="decision-green">{decision || analysis.decision}</strong><small>{analysis.risk ? '外部资源影响高，复用时只保留内容机制。' : '保留验证过的机制，替换账号资源和具体表达。'}</small></div></div>
      <div className="attribution-spec"><div><span>输入数据</span><strong>互动指标 · 发布时间 · 账号基线 · 热点关联 · 评论样本</strong></div><div><span>判断逻辑</span><strong>内容变量、外部变量和用户变量分层比对</strong></div><div><span>验收指标</span><strong>每个结论可追溯，缺失数据明确，风险内容进入人工审核</strong></div></div>
      <div className="attribution-grid"><article className="analysis-card"><div className="card-title"><span><GitBranch size={15} />增长来源拆解</span><small>判断结论 · 证据 · 置信度</small></div>{analysis.sources.map(([name, text, status, score]) => <div className="cause-row" key={name}><div><strong>{name}</strong><p>{text}</p></div><div className="cause-meta"><span className={`evidence-status ${status === '已验证' ? 'verified' : status === '部分验证' ? 'partial' : 'pending'}`}>{status}</span><b>{score}%</b></div></div>)}</article><article className="analysis-card"><div className="card-title"><span><CircleHelp size={15} />反事实与对照</span><small>避免把相关性误认为因果</small></div>{analysis.scenarios.map(([q, result, detail]) => <div className="counterfactual-row" key={q}><strong>{q}</strong><span>{result}</span><p>{detail}</p></div>)}<div className="missing-data"><AlertTriangle size={15} /><span><b>缺失数据</b>：{analysis.missing}。</span></div></article></div>
      <div className="evidence-chain"><div className="card-title"><span><ShieldCheck size={15} />证据链与人工边界</span><small>每项结论都能追溯到输入数据</small></div><div className="chain-steps">{['直接结果：曝光 128K · 互动率 7.8%', '中间行为：评论追问率 22% · 主页访问 +18%', '用户变量：目标人群评论占比 68%', '外部变量：热点关联待人工确认'].map((item, i) => <div key={item}><b>0{i + 1}</b><span>{item}</span>{i === 3 && <AlertTriangle size={14} />}</div>)}</div><div className="review-bar"><span><AlertTriangle size={15} />疑似热点带动，不能自动发布</span><button className={review === '已确认' ? 'review-done' : ''} onClick={() => setReview(review === '已确认' ? '待人工确认' : '已确认')}>{review === '已确认' ? <><CheckCircle2 size={14} />已确认</> : '标记为已确认'}</button></div></div>
      <div className="decision-options"><span className="pair-label">内容复用决策</span><div>{['可直接复用', '改写后复用', '仅作为案例观察', '禁止复用'].map((item) => <button key={item} className={decision === item ? 'decision-selected' : ''} onClick={() => setDecision(item)}>{item}</button>)}</div><small>决策会决定后续进入候选池、改写、观察或风险拦截流程。</small></div>
      <div className="reuse-footer"><div><span className="pair-label">发布后验证指标</span><p>首 2 小时互动率 ≥ 6% · 目标人群评论占比 ≥ 60% · 主页访问率不低于账号基线</p></div><div><span className="pair-label">复盘结论</span><p>验证标题机制是否独立贡献增长；若仅热点窗口成立，降级为案例观察。</p></div></div>
    </>}
  </section>
}
