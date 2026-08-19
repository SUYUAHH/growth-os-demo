const X_RECENT_SEARCH = 'https://api.twitter.com/2/tweets/search/recent'

export function isXConfigured() {
  return Boolean(process.env.X_BEARER_TOKEN)
}

export function xStatus() {
  return {
    configured: isXConfigured(),
    endpoint: X_RECENT_SEARCH,
    query: process.env.X_SEARCH_QUERY || '("easy dinner" OR "weekend trail" OR "daily ritual") lang:en -is:retweet',
    message: isXConfigured() ? 'X API v2 已配置，可执行真实监测。' : '未配置 X_BEARER_TOKEN，当前使用本地事件流。',
  }
}

export async function fetchRecentTweets(query = process.env.X_SEARCH_QUERY) {
  if (!isXConfigured()) {
    const error = new Error('Missing X_BEARER_TOKEN')
    error.code = 'X_NOT_CONFIGURED'
    throw error
  }

  const searchQuery = query || '("easy dinner" OR "weekend trail" OR "daily ritual") lang:en -is:retweet'
  const params = new URLSearchParams({
    query: searchQuery,
    max_results: '10',
    'tweet.fields': 'created_at,public_metrics,lang,entities',
    expansions: 'author_id',
    'user.fields': 'name,username,public_metrics',
  })
  const response = await fetch(`${X_RECENT_SEARCH}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` },
  })
  const payload = await response.json()
  if (!response.ok) {
    const error = new Error(payload.detail || payload.title || `X API error ${response.status}`)
    error.code = 'X_API_ERROR'
    error.status = response.status
    throw error
  }

  const users = new Map((payload.includes?.users || []).map((user) => [user.id, user]))
  return (payload.data || []).map((tweet) => {
    const author = users.get(tweet.author_id)
    return {
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      author: author ? `@${author.username}` : 'X user',
      metrics: tweet.public_metrics || {},
      url: author ? `https://x.com/${author.username}/status/${tweet.id}` : `https://x.com/i/web/status/${tweet.id}`,
    }
  })
}
