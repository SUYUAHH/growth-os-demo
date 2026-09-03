import { useMemo, useState } from 'react'
import { CheckCircle2, FileWarning, ShieldCheck } from 'lucide-react'
import { commonPlatformRules, evaluatePlatformRules, platformRules } from '../lib/platformRules'

export default function PlatformRuleLibrary({ text = '', hasMedia = false }) {
  const [channel, setChannel] = useState('X')
  const result = useMemo(() => evaluatePlatformRules(channel, { text, hasMedia }), [channel, text, hasMedia])
  return <section className="section-block platform-rule-library"><div className="platform-rule-head"><div><span className="eyebrow">05 · PLATFORM RULE LIBRARY</span><h2>多平台发布规则库</h2><p>切换平台查看不同的内容检查标准，规则只提供依据，最终保留人工确认。</p></div><span className={`platform-rule-status ${result.status === '通过' ? 'platform-rule-pass' : 'platform-rule-review'}`}>{result.passed}/{result.total} 条通过</span></div><div className="platform-tabs">{Object.keys(platformRules).map((item) => <button key={item} className={channel === item ? 'platform-tab-active' : ''} onClick={() => setChannel(item)}>{item}</button>)}</div><div className="platform-rule-grid">{result.checks.map((check) => <div className="platform-rule-row" key={check.id}><span className={`platform-rule-icon ${check.status === '通过' ? 'platform-rule-icon-pass' : 'platform-rule-icon-review'}`}>{check.status === '通过' ? <CheckCircle2 size={14} /> : <FileWarning size={14} />}</span><div><strong>{check.name}</strong><small>{check.detail}</small></div><b>{check.status}</b></div>)}</div><div className="common-rule-strip"><span><ShieldCheck size={13} />通用规则</span>{commonPlatformRules.map((rule) => <span key={rule.id} title={rule.description}>{rule.name}</span>)}</div></section>
}
