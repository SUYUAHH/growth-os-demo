import { useMemo, useState } from 'react'
import { CheckCircle2, FileWarning, ShieldCheck } from 'lucide-react'
import { qualityRules } from '../lib/contentQuality'
import { filterCandidates } from '../lib/candidateViews'

export default function RuleLibrary({ candidates = [], currentTrend, onReview, onToast }) {
  const uniqueCandidates = useMemo(() => filterCandidates(candidates, { accountId: 'all' }), [candidates])
  const matched = uniqueCandidates.find((candidate) => candidate.id === currentTrend?.id || candidate.postId === currentTrend?.id || candidate.title === currentTrend?.title)
  const [candidateId, setCandidateId] = useState(matched?.id || uniqueCandidates[0]?.id || '')
  const [ruleId, setRuleId] = useState('hook')
  const [decision, setDecision] = useState('通过')
  const [note, setNote] = useState('')
  const rule = useMemo(() => qualityRules.find((item) => item.id === ruleId) || qualityRules[0], [ruleId])
  const currentCandidate = uniqueCandidates.find((candidate) => candidate.id === candidateId)
  const reviews = currentCandidate?.ruleReviews || []
  const save = async () => {
    if (!candidateId) return onToast('请先从候选池选择一条内容')
    await onReview(candidateId, { ruleId, status: decision, note })
    setNote('')
  }
  return <div className="rule-library-interactive"><div className="rule-selector-row"><select value={candidateId} onChange={(event) => setCandidateId(event.target.value)} aria-label="选择审核内容"><option value="">选择候选内容</option>{uniqueCandidates.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.title.slice(0, 42)}</option>)}</select><select value={ruleId} onChange={(event) => setRuleId(event.target.value)} aria-label="选择规则">{qualityRules.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div><article className="rule-focus-card"><div><ShieldCheck size={15} /><span><strong>{rule.name}</strong><small>{rule.scope}</small></span></div><p>{rule.description}</p><em>适用结果会写入该候选内容的审核记录，保留人工判断。</em></article><div className="rule-decision-row">{['通过', '建议修改', '人工确认'].map((item) => <button key={item} className={decision === item ? `decision-active decision-${item}` : ''} onClick={() => setDecision(item)}>{item === '通过' ? <CheckCircle2 size={13} /> : <FileWarning size={13} />}{item}</button>)}</div><textarea className="rule-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="填写人工备注，例如：保留数字，但删除保证性表述。" /><button className="secondary-button rule-save-button" onClick={save} disabled={!candidateId}>保存审核结果</button>{reviews.length > 0 && <div className="rule-review-history"><strong>已保存的审核记录</strong>{reviews.slice().reverse().slice(0, 3).map((review, index) => <div key={`${review.ruleId}-${review.at}-${index}`}><span>{qualityRules.find((item) => item.id === review.ruleId)?.name || review.ruleId}</span><b>{review.status}</b><small>{review.note || '无备注'} · {new Date(review.at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div>)}</div>}</div>
}
