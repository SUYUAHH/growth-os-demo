import { useMemo } from 'react'
import { AlertTriangle, Check, Clock3, ShieldCheck } from 'lucide-react'
import StatusPill from './StatusPill'
import { evaluatePlatformRules } from '../lib/platformRules'

export default function XDistributionAudit({ trend, text, hasMedia, channel = 'X' }) {
  const audit = useMemo(() => evaluatePlatformRules(channel, { text, hasMedia }), [text, hasMedia, channel])
  return <section className="section-block x-audit-block"><div className="x-audit-head"><div><span className="eyebrow">PLATFORM-SPECIFIC DISTRIBUTION</span><h2>{channel} 场景化分发检查</h2><p>根据当前平台的内容目标检查规则，并明确给出修改建议。</p></div><StatusPill tone={audit.status === '通过' ? 'positive' : 'warning'}>{audit.status} · {audit.passed}/{audit.total} 通过</StatusPill></div><div className="x-audit-meta"><span><Clock3 size={13} />检查规则：{channel} 专属</span><span>目标渠道：{channel}</span><span>参考内容：{trend?.categoryLabel || '当前账号垂类'}</span></div><div className="x-check-list">{audit.checks.map((check) => <div className="x-check-row" key={check.id}><span className={`x-check-icon x-check-${check.status === '通过' ? 'pass' : 'edit'}`}>{check.status === '通过' ? <Check size={13} /> : <AlertTriangle size={13} />}</span><div><strong>{check.name}</strong><small>{check.detail}</small></div><b>{check.status}</b></div>)}</div><div className="x-next-action"><ShieldCheck size={15} /><span><strong>下一步：{audit.status === '通过' ? '可以进入人工审核' : '完成修改后重新检查'}</strong><small>自动检查只提供依据，最终发布仍保留人工确认。</small></span></div></section>
}
