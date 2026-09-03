import { useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, LoaderCircle, Plus, Radar, RefreshCw, Search, UsersRound } from 'lucide-react'
import { getDataReliability } from '../lib/operationsAnalytics.js'

function compact(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value || 0)
}

function interaction(post) {
  const metrics = post.metrics || {}
  return (metrics.likes || 0) + (metrics.replies || 0) + (metrics.reposts || 0) + (metrics.quotes || 0) + (metrics.bookmarks || 0)
}

function rate(value, base) {
  return base ? `${((value / base) * 100).toFixed(1)}%` : '—'
}

export default function CaptureWorkbench({ state, onCaptureKeywords, onAddAccount, onCaptureAccount, onCollectPost, onOpenPost, candidateCount = 0 }) {
  const [query, setQuery] = useState('AI OR OpenAI OR SaaS')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState('')
  const accounts = state?.benchmarkAccounts || []
  const posts = state?.contentLibrary || []
  const batches = state?.captureBatches || []
  const keywordPosts = useMemo(() => posts.filter((post) => post.sources?.includes('keyword') || post.sourceType === 'keyword'), [posts])

  const run = async (action, key) => {
    setBusy(key)
    try { await action() } finally { setBusy('') }
  }

  const submitKeywords = (event) => {
    event.preventDefault()
    if (!query.trim()) return
    run(() => onCaptureKeywords({ query }), 'keyword')
  }

  const submitAccount = (event) => {
    event.preventDefault()
    if (!username.trim()) return
    run(async () => { await onAddAccount({ username, category: '科技 / AI / 投资' }); setUsername('') }, 'account')
  }

  const candidatePostIds = new Set((state?.candidatePool || []).map((item) => item.postId))

  return <section className="capture-workbench section-block">
    <div className="capture-head">
      <div><div className="eyebrow"><Radar size={14} /> CONTENT CAPTURE <span className="eyebrow-line" /></div><h2>内容抓取与对标账号库</h2><p>关键词发现平台热点，对标账号持续沉淀原始内容，所有数据进入同一个内容库。</p></div>
<div className="capture-mode"><span className="capture-live-dot" />{state?.x?.configured ? 'X API 真实数据' : 'Demo 数据兜底'}<small>{getDataReliability(state?.x?.configured ? 'x-api' : 'demo', posts[0]?.metrics).detail}</small></div>
    </div>

    <div className="capture-command-grid">
      <form className="capture-form" onSubmit={submitKeywords}>
        <div className="capture-form-title"><Search size={15} /><strong>关键词搜索</strong><span>近 24 小时 · English</span></div>
        <label>搜索语句<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="AI OR OpenAI OR SaaS" /></label>
        <div className="capture-form-meta"><span>科技 / AI / 投资</span><button className="primary-button" type="submit" disabled={busy === 'keyword'}>{busy === 'keyword' ? <LoaderCircle className="spin" size={14} /> : <Radar size={14} />}开始抓取</button></div>
      </form>
      <form className="capture-form" onSubmit={submitAccount}>
        <div className="capture-form-title"><UsersRound size={15} /><strong>收录对标账号</strong><span>公开内容 · 无需授权</span></div>
        <label>X 用户名<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="例如 @OpenAI" /></label>
        <div className="capture-form-meta"><span>默认分类：科技 / AI / 投资</span><button className="secondary-button" type="submit" disabled={busy === 'account'}>{busy === 'account' ? <LoaderCircle className="spin" size={14} /> : <Plus size={14} />}收录账号</button></div>
      </form>
    </div>

    <div className="capture-summary"><div><span>内容库</span><strong>{posts.length}</strong><small>去重后帖子</small></div><div><span>关键词抓取</span><strong>{keywordPosts.length}</strong><small>平台发现</small></div><div><span>对标账号</span><strong>{accounts.length}</strong><small>已收录账号</small></div><div><span>候选收录池</span><strong>{candidateCount}</strong><small>待后续处理</small></div><div><span>最近批次</span><strong>{batches[0]?.count || 0}</strong><small>{batches[0] ? '条已完成' : '等待抓取'}</small></div></div>

    <div className="benchmark-capture-panel"><div className="capture-panel-title"><div><span className="eyebrow">BENCHMARK ACCOUNTS</span><h3>对标账号内容库</h3></div><span className="capture-panel-note">{accounts.length ? '按账号持续沉淀公开内容' : '收录账号后开始建立内容样本'}</span></div>{accounts.length ? <div className="benchmark-capture-list">{accounts.map((account) => <div className="benchmark-capture-row" key={account.id}><span className="benchmark-capture-avatar">{account.avatar}</span><span className="benchmark-capture-account"><strong>{account.name}</strong><small>{account.handle} · {account.category}</small></span><span><b>{account.capturedCount}</b><small>条内容</small></span><span><b>{compact(account.followers)}</b><small>粉丝</small></span><span className={`capture-status capture-${account.status === '监测中' ? 'on' : 'idle'}`}><CheckCircle2 size={12} />{account.status}</span><button className="text-button" onClick={() => run(() => onCaptureAccount(account.id), account.id)} disabled={busy === account.id}>{busy === account.id ? <LoaderCircle className="spin" size={13} /> : <RefreshCw size={13} />}抓取最新</button></div>)}</div> : <div className="capture-empty"><UsersRound size={18} /><span>还没有对标账号，先输入一个 X 用户名收录。</span></div>}</div>

    <div className="capture-posts-panel"><div className="capture-panel-title"><div><span className="eyebrow">CAPTURED CONTENT</span><h3>抓取内容展示</h3></div><span className="capture-panel-note">原始数据 · {posts.length} 条</span></div>{posts.length ? <div className="capture-post-list">{posts.slice(0, 20).map((post) => { const likes = post.metrics?.likes || 0; const replies = post.metrics?.replies || 0; const impressions = post.metrics?.impressions || 0; const followers = post.author?.followers || 0; const postTags = followers <= 200000 && rate(likes, impressions) !== '—' && likes / Math.max(followers, 1) > 0.055 ? ['低粉爆款'] : followers >= 500000 && rate(likes, impressions) !== '—' && likes / Math.max(impressions, 1) > 0.055 ? ['高粉高质量'] : []; return <article className="capture-post-row" key={post.id}><div className="capture-post-main"><div className="capture-post-source"><span>{post.author?.username || '@unknown'}</span><em>{post.sources?.join(' · ') || post.sourceType}</em><time>{post.createdAt ? new Date(post.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '时间未知'}</time></div><p>{post.text}</p><div className="capture-post-media">{post.media?.length ? post.media.map((media, index) => <span key={`${post.id}-${index}`}>{media.type === 'video' ? '视频' : media.type === 'animated_gif' ? 'GIF' : '图片'}</span>) : <span>纯文字</span>}{postTags.map((tag) => <span className="capture-quality-tag" key={tag}>{tag}</span>)}</div></div><div className="capture-post-metrics"><span><b>{compact(followers)}</b>粉丝</span><span><b>{rate(likes, impressions)}</b>点赞率</span><span><b>{compact(replies)}</b>评论</span><span><b>{compact(post.metrics?.reposts)}</b>转发</span><span><b>{compact(interaction(post))}</b>总互动</span></div><div className="capture-post-actions"><button className="secondary-button" disabled={candidatePostIds.has(post.id)} onClick={() => onCollectPost(post.id)}>{candidatePostIds.has(post.id) ? <CheckCircle2 size={13} /> : <Plus size={13} />}{candidatePostIds.has(post.id) ? '已收录' : '收录候选池'}</button><button className="icon-button" title="查看原帖" aria-label="查看原帖" onClick={() => onOpenPost?.(post.url)}><ExternalLink size={15} /></button></div></article>})}</div> : <div className="capture-empty"><Radar size={18} /><span>暂无抓取内容。可以先使用上方关键词搜索。</span></div>}</div>
  </section>
}
