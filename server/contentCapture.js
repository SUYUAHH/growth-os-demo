const defaultCategory = '科技 / AI / 投资'

export function normalizeBenchmarkAccount(input = {}) {
  const username = String(input.username || input.handle || '').trim().replace(/^@/, '')
  if (!username) throw new Error('请输入 X 用户名')
  return {
    id: input.id || `benchmark-${username.toLowerCase()}`,
    username,
    handle: `@${username}`,
    name: input.name || username,
    description: input.description || '',
    avatar: input.avatar || username.slice(0, 2).toUpperCase(),
    followers: Number(input.followers || 0),
    category: /^(ai|technology|tech)$/i.test(input.category || '') ? defaultCategory : (input.category || defaultCategory),
    status: input.status || '已收录',
    monitoring: Boolean(input.monitoring),
    lastCapturedAt: input.lastCapturedAt || null,
    capturedCount: Number(input.capturedCount || 0),
  }
}

export function normalizeCapturedPost(raw = {}, author = null, media = [], sourceType = 'keyword', sourceId = null) {
  const metrics = raw.public_metrics || raw.metrics || {}
  const username = author?.username ? `@${String(author.username).replace(/^@/, '')}` : (raw.author || '@unknown')
  const attachments = Array.isArray(media) ? media : []
  return {
    id: String(raw.id),
    text: String(raw.text || '').trim(),
    url: raw.url || (username !== '@unknown' ? `https://x.com/${username.slice(1)}/status/${raw.id}` : `https://x.com/i/web/status/${raw.id}`),
    createdAt: raw.created_at || raw.createdAt || null,
    author: { id: author?.id || raw.author_id || null, name: author?.name || username, username, followers: Number(author?.public_metrics?.followers_count || author?.followers || 0), avatar: author?.profile_image_url || '' },
    metrics: { likes: Number(metrics.like_count || metrics.likes || 0), replies: Number(metrics.reply_count || metrics.replies || 0), reposts: Number(metrics.retweet_count || metrics.reposts || 0), quotes: Number(metrics.quote_count || metrics.quotes || 0), bookmarks: Number(metrics.bookmark_count || metrics.bookmarks || 0), impressions: Number(metrics.impression_count || metrics.impressions || 0) },
    media: attachments.map((item) => ({ type: item.type, url: item.url || '', previewUrl: item.preview_image_url || item.previewUrl || item.url || '', durationMs: item.duration_ms || item.durationMs || null, width: item.width || null, height: item.height || null, altText: item.alt_text || item.altText || '' })),
    sourceType,
    sourceId,
    sources: [sourceType],
    capturedAt: new Date().toISOString(),
  }
}

export function mergeCapturedPosts(existing = [], incoming = []) {
  const merged = new Map(existing.map((post) => [post.id, { ...post, sources: [...new Set(post.sources || [post.sourceType].filter(Boolean))] }]))
  incoming.forEach((post) => {
    const current = merged.get(post.id)
    if (!current) merged.set(post.id, { ...post, sources: [...new Set([...(post.sources || []), post.sourceType].filter(Boolean))] })
    else merged.set(post.id, { ...current, ...post, sources: [...new Set([...(current.sources || []), ...(post.sources || []), post.sourceType].filter(Boolean))] })
  })
  return [...merged.values()].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
}
