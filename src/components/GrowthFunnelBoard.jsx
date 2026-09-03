import { ArrowDownRight, Target, TrendingUp } from 'lucide-react'
import { buildAcquisitionFunnel } from '../lib/growthOps.js'

const compact = (value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(value || 0)

export default function GrowthFunnelBoard({ data }) {
  const funnel = buildAcquisitionFunnel(data || { visits: 12800, signups: 2190, activated: 1040, retained: 386, paid: 92 })
  return <section className="section-block growth-funnel-board"><div className="growth-board-head"><div><span className="eyebrow"><TrendingUp size={13} /> CONTENT GROWTH OUTCOME</span><h2>内容增长结果验证</h2><p>这是内容运营的结果层，不单独替代产品生命周期系统：用访问、注册和首次激活验证内容质量。</p></div><span className="data-source-badge">Demo 演示数据</span></div><div className="growth-funnel-stages">{funnel.stages.map((stage, index) => <div className="growth-funnel-stage" key={stage.key} style={{ '--stage-width': `${Math.max(24, stage.rate)}%` }}><div className="growth-stage-top"><span>{stage.label}</span><strong>{compact(stage.value)}</strong></div><div className="growth-stage-bar"><i /></div>{index > 0 && <small>环比转化 {stage.rate}%</small>}</div>)}</div><div className="growth-funnel-conclusion"><Target size={14} /><span>当前主要瓶颈：<strong>{funnel.primaryBottleneck}</strong>。建议把下一轮内容 CTA 从“关注”改成“完成首次体验”，并用埋点验证。</span><ArrowDownRight size={14} /></div></section>
}
