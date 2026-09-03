const X_RECENT_SEARCH = 'https://api.twitter.com/2/tweets/search/recent'
const X_USERS_BY_USERNAME = 'https://api.twitter.com/2/users/by/username'
const X_USER_TWEETS = (id) => `https://api.twitter.com/2/users/${id}/tweets`
import { normalizeCapturedPost } from './contentCapture.js'

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

async function xRequest(endpoint, params) {
  const response = await fetch(`${endpoint}?${params}`, { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } })
  const payload = await response.json()
  if (!response.ok) {
    const error = new Error(payload.detail || payload.title || `X API error ${response.status}`)
    error.code = 'X_API_ERROR'
    error.status = response.status
    throw error
  }
  return payload
}

function normalizeQuery(query) {
  return query?.trim() || '((AI OR "artificial intelligence" OR OpenAI OR SaaS OR investing) lang:en) -is:retweet'
}

function normalizeApiItems(payload, sourceType, sourceId = null) {
  const users = new Map((payload.includes?.users || []).map((user) => [user.id, user]))
  const media = new Map((payload.includes?.media || []).map((item) => [item.media_key, item]))
  return (payload.data || []).map((tweet) => normalizeCapturedPost(tweet, users.get(tweet.author_id), (tweet.attachments?.media_keys || []).map((key) => media.get(key)).filter(Boolean), sourceType, sourceId))
}

export async function fetchRecentTweets(query = process.env.X_SEARCH_QUERY, options = {}) {
  if (!isXConfigured()) {
    const error = new Error('Missing X_BEARER_TOKEN')
    error.code = 'X_NOT_CONFIGURED'
    throw error
  }

  const searchQuery = normalizeQuery(query)
  const params = new URLSearchParams({
    query: searchQuery,
    start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    max_results: String(Math.min(Math.max(Number(options.limit || 25), 10), 100)),
    'tweet.fields': 'created_at,public_metrics,lang,entities,attachments,possibly_sensitive,conversation_id',
    expansions: 'author_id',
    'user.fields': 'name,username,public_metrics,profile_image_url,description',
    'media.fields': 'type,url,preview_image_url,duration_ms,width,height,alt_text,variants',
  })
  return normalizeApiItems(await xRequest(X_RECENT_SEARCH, params), 'keyword')
}

export async function fetchUser(username) {
  if (!isXConfigured()) {
    const error = new Error('Missing X_BEARER_TOKEN')
    error.code = 'X_NOT_CONFIGURED'
    throw error
  }
  const params = new URLSearchParams({ 'user.fields': 'name,username,public_metrics,profile_image_url,description,verified' })
  const payload = await xRequest(`${X_USERS_BY_USERNAME}/${encodeURIComponent(username.replace(/^@/, ''))}`, params)
  return payload.data
}

export async function fetchUserTweets(user, options = {}) {
  if (!isXConfigured()) {
    const error = new Error('Missing X_BEARER_TOKEN')
    error.code = 'X_NOT_CONFIGURED'
    throw error
  }
  const params = new URLSearchParams({ start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), max_results: String(Math.min(Math.max(Number(options.limit || 25), 5), 100)), 'tweet.fields': 'created_at,public_metrics,lang,entities,attachments,possibly_sensitive,conversation_id', expansions: 'attachments.media_keys', 'media.fields': 'type,url,preview_image_url,duration_ms,width,height,alt_text,variants' })
  return normalizeApiItems(await xRequest(X_USER_TWEETS(user.id), params), 'benchmark-account', user.id)
}

export function demoCapturedPosts(sourceType = 'keyword', sourceId = null, username = 'demo_ai_lab') {
  const base = Date.now()
  return [
    { id: `demo-post-${sourceId || 'keyword'}-1`, text: 'The AI tools that quietly changed how small teams ship every week.', created_at: new Date(base - 2 * 3600000).toISOString(), public_metrics: { like_count: 18600, reply_count: 740, retweet_count: 3200, quote_count: 410, bookmark_count: 1800, impression_count: 228000 }, author_id: 'demo-author-1' },
    { id: `demo-post-${sourceId || 'keyword'}-2`, text: 'A practical breakdown of what the latest funding round means for AI infrastructure.', created_at: new Date(base - 7 * 3600000).toISOString(), public_metrics: { like_count: 9400, reply_count: 520, retweet_count: 1800, quote_count: 260, bookmark_count: 1100, impression_count: 164000 }, author_id: 'demo-author-2' },
  ].map((tweet, index) => normalizeCapturedPost(tweet, { id: tweet.author_id, name: index ? 'Future Capital' : 'Demo AI Lab', username: index ? 'future_capital' : username, public_metrics: { followers_count: index ? 92000 : 8200 } }, index === 0 ? [{ type: 'photo', url: '', preview_image_url: '', alt_text: 'Demo research chart' }] : [{ type: 'video', preview_image_url: '', duration_ms: 42000 }], sourceType, sourceId))
}
