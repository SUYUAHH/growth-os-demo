import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Copy, FileCheck2, Image, MessageCircle, Play, ShieldCheck, Sparkles, Target } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import SectionHeader from '../components/SectionHeader'
import StatusPill from '../components/StatusPill'
import { account, accountSignals, activity, distributionRecommendations } from '../data/mockData'
import XDistributionAudit from '../components/XDistributionAudit'
import PlatformRulesDrawer from '../components/PlatformRulesDrawer'
import { evaluatePlatformRules, getPlatformBrief } from '../lib/platformRules'
import ComplianceGate from '../components/ComplianceGate'

function chineseDraft(trend, draft) {
  if (trend.chineseDraft) return trend.chineseDraft
  if (trend.category === 'food') return '下班回家，不需要复杂的晚餐。准备几样简单食材，十五分钟就能做好一顿热饭，也少洗一个锅。'
  if (trend.category === 'travel') return '周末不需要完整的行程表。一条半天走完的路线、一个安静的停留点，就足够让人重新找回状态。'
  return '有些时候，你不需要更大的改变。进门前留五分钟给自己，一个可以坚持的小仪式，就能让忙碌的一天柔软一点。'
}

function imagePrompt(trend) {
  if (trend.imagePrompt) return trend.imagePrompt
  if (trend.category === 'food') return '真实家庭厨房场景，15分钟快手晚餐，木质餐桌，暖色自然光，食物细节清晰，生活方式摄影，竖版 4:5，无文字无水印'
  if (trend.category === 'travel') return '北美森林半日徒步路线，人物背影走向安静的观景点，清晨自然光，真实户外摄影，竖版 4:5，无文字无水印'
  return '城市公寓傍晚生活场景，玄关旁的咖啡和书，柔和自然光，真实生活方式摄影，竖版 4:5，无文字无水印'
}

export default function Distribution({ trend, draft, completedActions, onComplete, onQueueReview, onOpenRemix, activity: activityData }) {
  const [channel, setChannel] = useState('X')
  const [language, setLanguage] = useState('zh')
  const [assetStatus, setAssetStatus] = useState('待补素材')
  const [publishStatus, setPublishStatus] = useState('待确认')
  const completedCount = completedActions.length
  const activityList = activityData?.length ? activityData : activity
  const zhDraft = chineseDraft(trend, draft)
  const media = trend.media || []
  const audit = useMemo(() => evaluatePlatformRules(channel, { text: language === 'zh' ? zhDraft : draft, hasMedia: media.length > 0 || assetStatus === '已确认素材' }), [channel, language, zhDraft, draft, media.length, assetStatus])
  const readiness = Math.round(audit.passed / Math.max(audit.total, 1) * 100)
  const handleReview = async () => { await onQueueReview(); setPublishStatus('已进入人工审核') }
  const confirmAsset = () => setAssetStatus(assetStatus === '已确认素材' ? '待补素材' : '已确认素材')
  return <div className="page-content page-distribution">
    <div className="page-hero"><div><div className="eyebrow"><Target size={14} /> DISTRIBUTION OPTIMIZER <span className="eyebrow-line" /></div><h1>让好内容，在对的时刻出现。</h1><p className="hero-copy">先确认中文内容、素材和风险，再进入人工审核；每一步都有明确结果。</p></div><div className="hero-actions"><button className="secondary-button" onClick={onOpenRemix}><ArrowLeft size={15} />回到二创</button><button className="primary-button" onClick={handleReview}><FileCheck2 size={15} />{publishStatus === '已进入人工审核' ? '已进入审核' : '进入审核队列'}</button></div></div>

    <div className="distribution-overview"><div className="readiness-score"><div className="score-ring"><div><strong>86</strong><span>/100</span></div></div><div><div className="eyebrow">PUBLISH READINESS</div><h3>{publishStatus === '已进入人工审核' ? '等待人工确认' : '可以审核，建议补素材'}</h3><p>内容检查完成 {completedCount} 项，素材状态：{assetStatus}。</p></div></div><div className="overview-divider" /><div className="channel-control"><span className="field-label">TARGET CHANNEL</span><div className="channel-tabs"><button className={channel === 'X' ? 'channel-active' : ''} onClick={() => setChannel('X')}>X</button><button className={channel === 'Instagram' ? 'channel-active' : ''} onClick={() => setChannel('Instagram')}>Instagram</button><button className={channel === 'TikTok' ? 'channel-active' : ''} onClick={() => setChannel('TikTok')}>TikTok</button></div><span className="channel-note">当前内容已按 {channel} 预览</span></div><div className="overview-divider" /><div className="publish-window"><span className="field-label">NEXT WINDOW</span><strong>今天 19:30</strong><span><Clock3 size={13} /> 建议发布时间 · {channel}</span></div></div>

    <div className="metric-grid metric-grid-three"><MetricCard label="建议发布时间" value="19:30" trend="+18%" detail="预估触达提升" tone="blue" /><MetricCard label="素材完整度" value={media.length ? '80%' : '40%'} trend={media.length ? '可用' : '待补'} detail="图片 / 视频 / 文案" tone="green" /><MetricCard label="发布状态" value={publishStatus === '待确认' ? '待审核' : '审核中'} trend="人工" detail="保留最终决策" tone="orange" /></div>

    <div className="platform-readiness-banner"><strong>{channel} 当前发布准备度：{readiness}/100</strong><span>平台目标：{getPlatformBrief(channel).goal}</span><small>{audit.status === '通过' ? '规则已通过，可进入人工审核。' : '存在平台专属检查项，完成修改后再进入审核。'}</small></div><XDistributionAudit trend={trend} text={language === 'zh' ? zhDraft : draft} hasMedia={media.length > 0 || assetStatus === '已确认素材'} channel={channel} />
    <ComplianceGate text={language === 'zh' ? zhDraft : draft} hasMedia={media.length > 0 || assetStatus === '已确认素材'} hasAffiliate={false} hasDisclosure={false} hasMediaRights={media.length > 0} />
    <PlatformRulesDrawer text={language === 'zh' ? zhDraft : draft} hasMedia={media.length > 0 || assetStatus === '已确认素材'} selectedChannel={channel} />

    <div className="distribution-grid"><div className="section-block recommendation-block"><SectionHeader eyebrow="01 · ACTION QUEUE" title="发布前行动队列" detail="每条建议完成后都会更新状态。" action={<span className="queue-count">{completedCount}/4 done</span>} /><div className="recommendation-list">{distributionRecommendations.map((item) => { const done = completedActions.includes(item.id); return <div className={`recommendation-row ${done ? 'recommendation-done' : ''}`} key={item.id}><button className={`check-button ${done ? 'check-done' : ''}`} onClick={() => onComplete(item.id)} aria-label={done ? `已完成${item.label}` : `完成${item.label}`}>{done && <Check size={14} />}</button><div className="recommendation-copy"><div><span className="recommendation-label">{item.label}</span><StatusPill tone={done ? 'positive' : item.tone}>{done ? '已完成' : item.status}</StatusPill></div><strong>{item.title}</strong><p>{item.detail}</p></div><div className="recommendation-score"><strong>{item.score}</strong><span>CONF.</span></div></div>})}</div></div>
      <div className="right-stack"><div className="section-block draft-preview"><SectionHeader eyebrow="02 · DRAFT PREVIEW" title="中文发布内容" action={<div className="language-options"><button className={language === 'zh' ? 'language-active' : ''} onClick={() => setLanguage('zh')}>中文</button><button className={language === 'original' ? 'language-active' : ''} onClick={() => setLanguage('original')}>原文</button></div>} /><div className="draft-preview-card"><div className="draft-preview-head"><span className="creator-avatar">LA</span><div><strong>{account.handle}</strong><small>{channel} · {language === 'zh' ? '中文预览' : 'Original'}</small></div><StatusPill tone={publishStatus === '待确认' ? 'warning' : 'positive'}>{publishStatus}</StatusPill></div><p>{language === 'zh' ? zhDraft : draft}</p><div className="draft-preview-tags"><span><Sparkles size={12} /> 已保留原意</span><span><MessageCircle size={12} /> 评论引导待确认</span></div></div></div>
        <div className="section-block asset-guidance-block"><SectionHeader eyebrow="03 · MEDIA ASSET" title="发布素材建议" detail="没有可用图片时，直接复制提示词给图像模型。" action={<StatusPill tone={assetStatus === '已确认素材' ? 'positive' : 'warning'}>{assetStatus}</StatusPill>} /><div className="asset-preview-row">{media.length ? media.slice(0, 2).map((item, index) => <div className="asset-preview" key={index}>{item.previewUrl ? <img src={item.previewUrl} alt={item.altText || '推荐素材'} /> : <div className="asset-empty"><Play size={18} />视频素材</div>}<small>{item.type === 'video' ? '视频封面' : '推荐图片'}</small></div>) : <div className="asset-empty asset-empty-wide"><Image size={20} /><span>当前没有可直接使用的图片素材</span></div>}</div><div className="prompt-box"><div><span className="field-label">AI IMAGE PROMPT</span><button className="icon-button" title="复制提示词" aria-label="复制提示词" onClick={() => navigator.clipboard?.writeText(imagePrompt(trend))}><Copy size={14} /></button></div><p>{imagePrompt(trend)}</p></div><button className="secondary-button asset-confirm-button" onClick={confirmAsset}><CheckCircle2 size={14} />{assetStatus === '已确认素材' ? '取消素材确认' : '确认素材方案'}</button></div>
        <div className="section-block health-block"><SectionHeader eyebrow="04 · HEALTH SIGNALS" title="账号状态" action={<button className="text-button" onClick={onOpenRemix}>查看复盘 <ArrowRight size={14} /></button>} /><div className="mini-health-list">{accountSignals.slice(0, 3).map((signal) => <div key={signal.label}><span>{signal.label}</span><span className="mini-track"><span style={{ width: `${signal.value}%` }} /></span><strong>{signal.value}</strong></div>)}</div><div className="risk-note"><ShieldCheck size={15} /><span>未发现账号级发布风险，建议保留人工审核。</span></div></div></div></div>

    <div className="section-block activity-block"><SectionHeader eyebrow="05 · AUDIT TRAIL" title="确认结果与操作记录" detail="确认、修改和进入审核都会留在这里。" action={<button className="text-button">导出报告 <ArrowRight size={14} /></button>} /><div className="confirmation-result"><span className="confirmation-icon"><CheckCircle2 size={16} /></span><div><strong>{publishStatus === '已进入人工审核' ? '内容已进入人工审核队列' : assetStatus === '已确认素材' ? '素材方案已确认，可进入人工审核' : '等待确认素材方案'}</strong><small>下一步：{publishStatus === '已进入人工审核' ? '人工审核通过后进入待发布状态。' : '确认图片或复制 AI 提示词生成素材。'}</small></div></div><div className="activity-list">{activityList.map((item) => <div className="activity-row" key={item.time + item.text}><span className="activity-time">{item.time}</span><span className={`activity-dot activity-${item.type}`} /><span className="activity-text">{item.text}</span><span className="activity-source">system log</span></div>)}</div></div>
  </div>
}
