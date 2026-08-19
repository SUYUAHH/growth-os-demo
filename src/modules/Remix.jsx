import { ArrowLeft, ArrowRight, BookMarked, Check, Clipboard, Edit3, FileText, Lightbulb, Play, RefreshCw, ScanSearch, WandSparkles } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import StatusPill from '../components/StatusPill'
import { breakdown, concepts } from '../data/mockData'

export default function Remix({ trend, activeConceptId, draft, savedConcepts, generated, generating, onGenerate, onSelectConcept, onDraftChange, onSave, onOpenDistribution }) {
  const breakdownItems = generated?.breakdown?.length ? generated.breakdown : breakdown
  const conceptList = generated?.concepts?.length ? generated.concepts : concepts
  const activeConcept = conceptList.find((concept) => concept.id === activeConceptId) || conceptList[0]
  return (
    <div className="page-content page-remix">
      <div className="page-hero remix-hero">
        <div><div className="eyebrow"><WandSparkles size={14} /> VIRAL REMIX STUDIO <span className="eyebrow-line" /></div><h1>把爆款变成自己的下一条。</h1><p className="hero-copy">拆出可迁移的表达机制，再把它放回账号定位和真实场景里。</p></div>
        <div className="hero-actions"><span className="workflow-step step-done"><Check size={13} />机会已选择</span><span className="workflow-arrow">→</span><span className="workflow-step step-active">2 · 拆解与二创</span><span className="workflow-arrow">→</span><span className="workflow-step">3 · 发布优化</span></div>
      </div>

      <div className="source-strip"><div className="source-strip-icon"><ScanSearch size={17} /></div><div className="source-strip-copy"><span className="eyebrow">CURRENT INPUT · OPPORTUNITY SIGNAL</span><strong>{trend.title}</strong><small>{trend.source} · {trend.views} views · {trend.audience}</small></div><StatusPill tone="positive">{trend.status}</StatusPill></div>

      <div className="remix-grid">
        <div className="remix-left">
          <div className="section-block"><SectionHeader eyebrow="01 · BREAKDOWN" title="一条内容，为什么有效？" detail="从表面选题拆到可迁移机制。" /><div className="breakdown-grid">{breakdownItems.map((item, index) => <div className="breakdown-item" key={item.label}><span className="breakdown-index">0{index + 1}</span><span className="breakdown-label">{item.label}</span><strong>{item.value}</strong><p>{item.detail}</p></div>)}</div><div className="principle-callout"><div className="callout-icon"><Lightbulb size={16} /></div><div><span className="eyebrow">REUSABLE PRINCIPLE</span><strong>把产品卖点翻译成用户愿意分享的生活判断。</strong><p>不复制“宏大生活方式”的表面词汇，保留“从抽象感受切到具体日常”的叙事机制。</p></div><button className="icon-button" aria-label="保存原则" title="保存原则"><BookMarked size={16} /></button></div></div>
          <div className="section-block"><SectionHeader eyebrow="02 · SOURCE POST" title="参考内容" action={<button className="text-button"><Clipboard size={14} />复制来源</button>} /><div className="source-post"><div className="source-post-head"><span className="creator-avatar">M</span><span><strong>@mila.moves</strong><small>Today · 09:08</small></span><span className="source-platform">TIKTOK</span></div><p>“{trend.sourcePost}”</p><div className="source-post-footer"><span><Play size={13} /> 12.8M views</span><span>8.6% save rate</span><span>3.2K comments</span></div></div></div>
        </div>

        <div className="remix-right">
          <div className="section-block concepts-block"><SectionHeader eyebrow="03 · GENERATION" title="三个可执行方向" detail="已结合账号定位、趋势语境和对标缺口生成。" action={<div className="generation-actions"><span className="provider-chip">{generated?.provider === 'model' ? 'MODEL' : 'LOCAL RULES'}</span><button className="text-button" onClick={() => onGenerate(false)} disabled={generating}><RefreshCw size={13} className={generating ? 'spin' : ''} />{generating ? '生成中...' : '重新分析'}</button></div>} /><div className="concept-list">{conceptList.map((concept) => <button key={concept.id} className={`concept-row ${concept.id === activeConceptId ? 'concept-selected' : ''}`} onClick={() => onSelectConcept(concept)}><span className="concept-label">{concept.label}</span><span className="concept-title">{concept.title}</span><span className="concept-angle">{concept.angle}</span><span className="concept-score">{concept.score}<small>FIT</small></span><ArrowRight size={15} /></button>)}</div></div>
          <div className="section-block editor-block"><div className="editor-head"><div><div className="eyebrow">04 · CONTENT ASSET</div><h3>{activeConcept.title}</h3></div><StatusPill tone={savedConcepts.includes(activeConcept.id) ? 'positive' : 'warning'}>{savedConcepts.includes(activeConcept.id) ? '待审核' : '草稿'}</StatusPill></div><div className="editor-meta"><span><FileText size={13} /> {trend.category}</span><span><Edit3 size={13} /> English · TikTok</span><span><span className="green-dot" /> AI generated</span></div><textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} aria-label="二创内容草稿" /><div className="editor-footer"><span>{draft.length} chars · recommended 180-260</span><button className="secondary-button" onClick={onSave}><BookMarked size={15} />{savedConcepts.includes(activeConcept.id) ? '已保存' : '保存到资产库'}</button></div></div>
          <button className="primary-button full-button remix-next" onClick={onOpenDistribution}>进入分发优化 <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>
  )
}
