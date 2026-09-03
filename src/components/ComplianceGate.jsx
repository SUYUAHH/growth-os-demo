import { useMemo } from 'react'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { evaluateComplianceRules } from '../lib/platformRules.js'

export default function ComplianceGate({ text = '', hasMedia = false, hasAffiliate = false, hasDisclosure = false, hasMediaRights = false, aiGenerated = false, aiDisclosure = false }) {
  const result = useMemo(() => evaluateComplianceRules({ text, hasMedia, hasAffiliate, hasDisclosure, hasMediaRights, aiGenerated, aiDisclosure }), [text, hasMedia, hasAffiliate, hasDisclosure, hasMediaRights, aiGenerated, aiDisclosure])
  return <div className={`compliance-gate ${result.status === '通过' ? 'compliance-pass' : 'compliance-review'}`}><div><strong>{result.status === '通过' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}海外合规闸门 · {result.status}</strong><small>广告披露、效果声明、隐私、素材权利和 AI 标识</small></div><div className="compliance-checks">{result.checks.map((item) => <span key={item.id} title={item.detail}>{item.name} · {item.status}</span>)}</div></div>
}
