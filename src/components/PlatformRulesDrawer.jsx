import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, FileWarning, PanelRightClose, PanelRightOpen, ShieldCheck } from 'lucide-react'
import { commonPlatformRules, evaluatePlatformRules, getPlatformBrief, platformRules } from '../lib/platformRules'

export default function PlatformRulesDrawer({ text = '', hasMedia = false, selectedChannel = 'X' }) {
  const [channel, setChannel] = useState('X')
  const [open, setOpen] = useState(false)
  const result = useMemo(() => evaluatePlatformRules(channel, { text, hasMedia }), [channel, text, hasMedia])
  useEffect(() => setChannel(selectedChannel), [selectedChannel])
  const brief = getPlatformBrief(channel)
  return <>
    <button className="platform-rules-drawer-trigger" onClick={() => setOpen(true)}><BookOpen size={14} />多平台规则库 <PanelRightOpen size={14} /></button>
    {open && <button className="platform-rules-drawer-backdrop" aria-label="关闭多平台规则库" onClick={() => setOpen(false)} />}
    <aside className={`platform-rules-drawer ${open ? 'platform-rules-drawer-open' : ''}`} aria-label="多平台规则库">
      <div className="platform-rules-drawer-head"><div><span className="eyebrow">PLATFORM RULE LIBRARY</span><h2>多平台发布规则库</h2><p>规则检查提供依据，发布前仍保留人工确认。</p></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="关闭规则库"><PanelRightClose size={16} /></button></div>
      <div className="platform-tabs">{Object.keys(platformRules).map((item) => <button key={item} className={channel === item ? 'platform-tab-active' : ''} onClick={() => setChannel(item)}>{item}</button>)}</div>
      <div className="platform-brief-card"><strong>平台目标：{brief.goal}</strong><span>内容类型：{brief.contentTypes.join('、')}</span><span>风险等级：{brief.riskLevel} · 规则命中后必须复核</span></div>
      <div className="platform-rule-summary"><strong>{channel} 规则检查</strong><span>{result.passed}/{result.total} 条通过 · {result.status}</span></div>
      <div className="platform-rule-grid">{result.checks.map((check) => <div className="platform-rule-row" key={check.id}><span className={`platform-rule-icon ${check.status === '通过' ? 'platform-rule-icon-pass' : 'platform-rule-icon-review'}`}>{check.status === '通过' ? <CheckCircle2 size={14} /> : <FileWarning size={14} />}</span><div><strong>{check.name}</strong><small>{check.detail}</small></div><b>{check.manualReview ? '需人工复核' : check.status}</b></div>)}</div>
      <div className="common-rule-strip"><span><ShieldCheck size={13} />通用规则</span>{commonPlatformRules.map((rule) => <span key={rule.id} title={rule.description}>{rule.name}</span>)}</div>
    </aside>
  </>
}
