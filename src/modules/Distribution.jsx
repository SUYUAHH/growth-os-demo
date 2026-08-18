import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, FileCheck2, MessageCircle, ShieldCheck, Sparkles, Target } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import SectionHeader from '../components/SectionHeader'
import StatusPill from '../components/StatusPill'
import { account, accountSignals, activity, distributionRecommendations } from '../data/mockData'

export default function Distribution({ trend, draft, completedActions, onComplete, onQueueReview, onOpenRemix, activity: activityData }) {
  const [channel, setChannel] = useState('TikTok')
  const completedCount = completedActions.length
  const activityList = activityData?.length ? activityData : activity
  return (
    <div className="page-content page-distribution">
      <div className="page-hero">
        <div><div className="eyebrow"><Target size={14} /> DISTRIBUTION OPTIMIZER <span className="eyebrow-line" /></div><h1>让好内容，在对的时刻出现。</h1><p className="hero-copy">发布前检查内容、账号状态和平台节奏，把 Agent 的判断变成可执行动作。</p></div>
        <div className="hero-actions"><button className="secondary-button" onClick={onOpenRemix}><ArrowLeft size={15} />回到二创</button><button className="primary-button" onClick={onQueueReview}><FileCheck2 size={15} />进入审核队列</button></div>
      </div>

      <div className="distribution-overview"><div className="readiness-score"><div className="score-ring"><div><strong>86</strong><span>/100</span></div></div><div><div className="eyebrow">PUBLISH READINESS</div><h3>可以发布，建议微调</h3><p>4 项检查中已完成 {completedCount} 项，1 项建议人工确认。</p></div></div><div className="overview-divider" /><div className="channel-control"><span className="field-label">TARGET CHANNEL</span><div className="channel-tabs"><button className={channel === 'TikTok' ? 'channel-active' : ''} onClick={() => setChannel('TikTok')}>TikTok</button><button className={channel === 'Instagram' ? 'channel-active' : ''} onClick={() => setChannel('Instagram')}>Instagram</button></div><span className="channel-note">基于 {account.region} 受众活跃时间</span></div><div className="overview-divider" /><div className="publish-window"><span className="field-label">NEXT WINDOW</span><strong>Thu · 19:30</strong><span><Clock3 size={13} /> in 2 days · {channel}</span></div></div>

      <div className="metric-grid metric-grid-three"><MetricCard label="建议发布时间" value="19:30" trend="+18%" detail="预估触达提升" tone="blue" /><MetricCard label="账号健康" value={`${account.health}/100`} trend="+6" detail="vs. last week" tone="green" /><MetricCard label="人工确认项" value="01" trend="必须" detail="绝对化表达" tone="orange" /></div>

      <div className="distribution-grid">
        <div className="section-block recommendation-block"><SectionHeader eyebrow="01 · ACTION QUEUE" title="发布前行动队列" detail="每条建议都绑定一个可验证的动作。" action={<span className="queue-count">{completedCount}/4 done</span>} /><div className="recommendation-list">{distributionRecommendations.map((item) => { const done = completedActions.includes(item.id); return <div className={`recommendation-row ${done ? 'recommendation-done' : ''}`} key={item.id}><button className={`check-button ${done ? 'check-done' : ''}`} onClick={() => onComplete(item.id)} aria-label={done ? `已完成${item.label}` : `完成${item.label}`}>{done && <Check size={14} />}</button><div className="recommendation-copy"><div><span className="recommendation-label">{item.label}</span><StatusPill tone={done ? 'positive' : item.tone}>{done ? '已完成' : item.status}</StatusPill></div><strong>{item.title}</strong><p>{item.detail}</p></div><div className="recommendation-score"><strong>{item.score}</strong><span>CONF.</span></div></div>})}</div></div>
        <div className="right-stack"><div className="section-block draft-preview"><SectionHeader eyebrow="02 · DRAFT PREVIEW" title="当前待发布内容" action={<button className="text-button" onClick={onOpenRemix}>编辑 <ArrowRight size={14} /></button>} /><div className="draft-preview-card"><div className="draft-preview-head"><span className="creator-avatar">LA</span><div><strong>{account.handle}</strong><small>{channel} · English</small></div><StatusPill tone="warning">待审核</StatusPill></div><p>{draft}</p><div className="draft-preview-tags"><span><Sparkles size={12} /> Concept 01</span><span><MessageCircle size={12} /> CTA pending</span></div></div></div><div className="section-block health-block"><SectionHeader eyebrow="03 · HEALTH SIGNALS" title="账号状态" action={<button className="text-button" onClick={onOpenRemix}>查看复盘 <ArrowRight size={14} /></button>} /><div className="mini-health-list">{accountSignals.slice(0, 3).map((signal) => <div key={signal.label}><span>{signal.label}</span><span className="mini-track"><span style={{ width: `${signal.value}%` }} /></span><strong>{signal.value}</strong></div>)}</div><div className="risk-note"><ShieldCheck size={15} /><span>未发现账号级发布风险，建议保留人工审核。</span></div></div></div>
      </div>

      <div className="section-block activity-block"><SectionHeader eyebrow="04 · AUDIT TRAIL" title="Agent 工作记录" detail="每次判断都有来源，方便回到业务现场复盘。" action={<button className="text-button">导出报告 <ArrowRight size={14} /></button>} /><div className="activity-list">{activityList.map((item) => <div className="activity-row" key={item.time + item.text}><span className="activity-time">{item.time}</span><span className={`activity-dot activity-${item.type}`} /><span className="activity-text">{item.text}</span><span className="activity-source">system log</span></div>)}</div></div>
    </div>
  )
}
