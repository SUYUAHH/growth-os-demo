import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, BookMarked, Check, CheckCircle2, Clipboard, Edit3, FileText, Lightbulb, Play, RefreshCw, ScanSearch, ShieldCheck, WandSparkles } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import StatusPill from '../components/StatusPill'
import { breakdown, concepts } from '../data/mockData'
import { evaluateContentQuality, qualityRules } from '../lib/contentQuality'
import RuleLibrary from '../components/RuleLibrary'

export default function Remix({ trend, activeConceptId, draft, savedConcepts, generated, generating, onGenerate, onSelectConcept, onDraftChange, onSave, onOpenDistribution, candidates, onReviewKnowledgeRule, onToast }) {
  const breakdownItems = generated?.breakdown?.length ? generated.breakdown : breakdown
  const conceptList = generated?.concepts?.length ? generated.concepts : concepts
  const activeConcept = conceptList.find((concept) => concept.id === activeConceptId) || conceptList[0]
  const quality = evaluateContentQuality(trend)
  const [qualityOverride, setQualityOverride] = useState(null)
  const qualityStatus = qualityOverride || quality.status
  const qualityIcon = qualityStatus === '通过' ? <CheckCircle2 size={14} /> : qualityStatus === '人工确认' ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />
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
          <div className="section-block"><SectionHeader eyebrow="02 · SOURCE POST" title="参考内容" action={<button className="text-button"><Clipboard size={14} />复制来源</button>} /><div className="source-post"><div className="source-post-head"><span className="creator-avatar">M</span><span><strong>{trend.author?.username || '@mila.moves'}</strong><small>{trend.publishedAt || trend.age || '刚刚'}</small></span><span className="source-platform">{trend.platform || 'X'}</span></div><p>“{trend.sourcePost || trend.title}”</p><div className="source-post-media-grid">{(trend.media || []).map((media, index) => <div className="source-post-media" key={`${media.previewUrl || media.url}-${index}`}>{media.previewUrl || media.url ? <img src={media.previewUrl || media.url} alt={media.altText || '参考内容媒体'} /> : <div className="source-post-media-empty">暂无预览</div>}{media.type === 'video' && <span className="source-post-play"><Play size={16} /></span>}<small>{media.type === 'video' ? '视频预览' : '图片预览'}</small></div>)}</div><div className="source-post-footer"><span><Play size={13} /> {trend.views || '—'} 浏览量</span><span>{trend.likeRate || '—'} 点赞率</span><span>{trend.comments || '—'} 评论</span></div></div></div>
          <div className="section-block quality-check-block"><SectionHeader eyebrow="03 · X CONTENT QUALITY" title="X 内容质量检查" detail="针对文字钩子、互动潜力和平台风险进行检查，最终保留人工确认。" action={<span className={`quality-status quality-${qualityStatus === '通过' ? 'pass' : qualityStatus === '人工确认' ? 'review' : 'edit'}`}>{qualityIcon}{qualityStatus}</span>} /><div className="quality-score-row"><div><strong>{quality.score}</strong><small>/100 规则评分</small></div><p>{quality.recommendation}</p></div><div className="quality-check-list">{quality.checks.map((check) => <div className="quality-check-row" key={check.id}><span className={`quality-check-icon quality-check-${check.status === '通过' ? 'pass' : check.status === '人工确认' ? 'review' : 'edit'}`}>{check.status === '通过' ? <Check size={13} /> : check.status === '人工确认' ? <AlertTriangle size={13} /> : <Edit3 size={13} />}</span><div><strong>{check.name}</strong><small>{check.detail}</small></div><b>{check.status}</b></div>)}</div><button className="secondary-button quality-confirm-button" onClick={() => setQualityOverride(qualityOverride === '已确认' ? null : '已确认')}><CheckCircle2 size={14} />{qualityOverride === '已确认' ? '已完成人工确认' : '人工确认结果'}</button></div>
        </div>

        <div className="remix-right">
          <div className="section-block concepts-block"><SectionHeader eyebrow="03 · GENERATION" title="三个可执行方向" detail="已结合账号定位、趋势语境和对标缺口生成。" action={<div className="generation-actions"><span className="provider-chip">{generated?.provider === 'model' ? 'MODEL' : 'LOCAL RULES'}</span><button className="text-button" onClick={() => onGenerate(false)} disabled={generating}><RefreshCw size={13} className={generating ? 'spin' : ''} />{generating ? '生成中...' : '重新分析'}</button></div>} /><div className="concept-list">{conceptList.map((concept) => <button key={concept.id} className={`concept-row ${concept.id === activeConceptId ? 'concept-selected' : ''}`} onClick={() => onSelectConcept(concept)}><span className="concept-label">{concept.label}</span><span className="concept-title">{concept.title}</span><span className="concept-angle">{concept.angle}</span><span className="concept-score">{concept.score}<small>FIT</small></span><ArrowRight size={15} /></button>)}</div></div>
          <div className="section-block rule-library-block"><SectionHeader eyebrow="04 · RULE LIBRARY" title="X 规则知识库" detail="把团队经验沉淀为可复用规则，规则只提供判断依据，不替代人工决策。" /><RuleLibrary candidates={candidates} currentTrend={trend} onReview={onReviewKnowledgeRule} onToast={onToast} /></div>
          <div className="section-block editor-block"><div className="editor-head"><div><div className="eyebrow">04 · CONTENT ASSET</div><h3>{activeConcept.title}</h3></div><StatusPill tone={savedConcepts.includes(activeConcept.id) ? 'positive' : 'warning'}>{savedConcepts.includes(activeConcept.id) ? '待审核' : '草稿'}</StatusPill></div><div className="editor-meta"><span><FileText size={13} /> {trend.category}</span><span><Edit3 size={13} /> English · TikTok</span><span><span className="green-dot" /> AI generated</span></div><textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} aria-label="二创内容草稿" /><div className="editor-footer"><span>{draft.length} chars · recommended 180-260</span><button className="secondary-button" onClick={onSave}><BookMarked size={15} />{savedConcepts.includes(activeConcept.id) ? '已保存' : '保存到资产库'}</button></div></div>
          <button className="primary-button full-button remix-next" onClick={onOpenDistribution}>进入分发优化 <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>
  )
}
