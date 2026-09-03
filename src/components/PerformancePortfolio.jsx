import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { buildPerformancePortfolio } from '../lib/operationsAnalytics.js'

const compact = (value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(value || 0)

export default function PerformancePortfolio({ assets = [] }) {
  const portfolio = useMemo(() => buildPerformancePortfolio(assets), [assets])
  if (!portfolio.sampleSize) return null
  return <section className="section-block performance-portfolio"><div className="asset-detail-title"><strong><BarChart3 size={14} /> 多内容横向复盘</strong><small>{portfolio.sampleSize} 条已回流</small></div><p className="portfolio-explain">按平台和标签比较真实表现，帮助决定下一轮账号、选题和发布时间，而不是只复盘单条内容。</p><div className="portfolio-breakdown"><div><span className="pair-label">平台表现</span>{Object.entries(portfolio.byChannel).map(([channel, item]) => <div className="portfolio-row" key={channel}><strong>{channel}</strong><span>{item.posts} 条 · {compact(item.impressions)} 曝光 · {item.likeRate}% 赞率 · {item.commentRate}% 评论率</span></div>)}</div><div><span className="pair-label">标签表现</span>{Object.entries(portfolio.byTag).map(([tag, item]) => <div className="portfolio-row" key={tag}><strong>{tag}</strong><span>{item.posts} 条 · {item.commentRate}% 评论率 · 粉丝变化 {item.followersDelta >= 0 ? '+' : ''}{item.followersDelta}</span></div>)}</div></div><div className="portfolio-conclusion">当前评论效率最高的运营信号：<strong>{portfolio.bestDimension}</strong>。建议下一轮优先围绕它设计 3 条小样本内容。</div></section>
}
