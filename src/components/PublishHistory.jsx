import { ExternalLink, History } from 'lucide-react'
import { localTimeLabel } from '../lib/operationsAnalytics.js'

export default function PublishHistory({ asset }) {
  if (!asset?.publishRecords?.length) return null
  return <section className="publish-history section-block"><div className="asset-detail-title"><strong><History size={14} /> 发布记录</strong><small>{asset.publishRecords.length} 次</small></div>{asset.publishRecords.map((record) => <div className="publish-history-row" key={record.id}><div><strong>{record.channel} · {record.operator}</strong><small>{record.localTime || localTimeLabel(record.publishedAt, asset.timeZone)} · 账号：{record.accountId || '未分配'}</small></div>{record.url ? <a href={record.url} target="_blank" rel="noreferrer"><ExternalLink size={13} />查看发布</a> : <span>待补链接</span>}</div>)}</section>
}
