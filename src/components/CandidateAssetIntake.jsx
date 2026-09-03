import { CheckCircle2, Sparkles } from 'lucide-react'
import SectionHeader from './SectionHeader'
import StatusPill from './StatusPill'

export default function CandidateAssetIntake({ candidates, onCreate }) {
  return <section className="section-block candidate-asset-intake"><SectionHeader eyebrow="FROM CANDIDATE POOL" title="候选内容待转为资产" detail="抓取内容先保留在候选池；点击创建后，原帖数据会同步进入资产详情。" /><div className="asset-candidate-list">{candidates.map((candidate) => <article key={candidate.id}><div><StatusPill tone="neutral">{candidate.status}</StatusPill><strong>{candidate.title}</strong><small>{candidate.accountName || '未分配账号'} · {candidate.categoryLabel || '未分类'} · {candidate.metrics?.impressions ? `${candidate.metrics.impressions.toLocaleString('zh-CN')} 曝光` : '暂无曝光数据'}</small></div><button className="secondary-button" onClick={() => onCreate(candidate)}><Sparkles size={14} />创建资产</button></article>)}</div></section>
}
