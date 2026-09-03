import { useState } from 'react'

export default function PublishMetadata({ asset, onSave }) {
  const [url, setUrl] = useState(asset?.publishUrl || '')
  if (!asset || asset.status === '已归档') return null
  return <div className="publish-metadata"><label>发布链接（发布后粘贴）<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://x.com/..." /></label><button className="secondary-button" onClick={() => onSave(asset.id, { publishUrl: url })}>保存链接</button></div>
}
