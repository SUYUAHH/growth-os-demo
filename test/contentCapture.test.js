import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeCapturedPosts, normalizeCapturedPost, normalizeBenchmarkAccount } from '../server/contentCapture.js'
import { addBenchmarkAccount, createCandidateFromCapturedPost, saveCapturedPosts } from '../server/growthEngine.js'

test('normalizes an X post with author metrics and media attachments', () => {
  const post = normalizeCapturedPost({
    id: 'post-1',
    text: 'New AI research',
    created_at: '2026-08-31T08:00:00.000Z',
    author_id: 'author-1',
    public_metrics: { like_count: 120, reply_count: 14, retweet_count: 31, quote_count: 4, bookmark_count: 9, impression_count: 9000 },
    attachments: { media_keys: ['media-1'] },
  }, {
    id: 'author-1', name: 'AI Lab', username: 'ai_lab', public_metrics: { followers_count: 8200 },
  }, [{ media_key: 'media-1', type: 'photo', url: 'https://img.test/ai.png', alt_text: 'research chart' }], 'keyword')

  assert.deepEqual(post.metrics, { likes: 120, replies: 14, reposts: 31, quotes: 4, bookmarks: 9, impressions: 9000 })
  assert.equal(post.author.username, '@ai_lab')
  assert.equal(post.author.followers, 8200)
  assert.equal(post.media[0].type, 'photo')
  assert.equal(post.sourceType, 'keyword')
})

test('merges keyword and benchmark captures without duplicating a post', () => {
  const first = normalizeCapturedPost({ id: 'same', text: 'AI post', created_at: '2026-08-31T08:00:00.000Z', public_metrics: { like_count: 1 } }, null, [], 'keyword')
  const second = { ...first, sourceType: 'benchmark-account', sourceId: 'account-1' }
  const merged = mergeCapturedPosts([first], [second])
  assert.equal(merged.length, 1)
  assert.deepEqual(merged[0].sources, ['keyword', 'benchmark-account'])
})

test('normalizes a benchmark account handle and monitoring defaults', () => {
  const account = normalizeBenchmarkAccount({ username: '@OpenAI', category: 'AI' })
  assert.equal(account.username, 'OpenAI')
  assert.equal(account.handle, '@OpenAI')
  assert.equal(account.category, '科技 / AI / 投资')
  assert.equal(account.status, '已收录')
  assert.equal(account.monitoring, false)
})

test('adds a benchmark account and persists captured posts in one shared library', () => {
  const state = { benchmarkAccounts: [], contentLibrary: [], captureBatches: [], activity: [] }
  const withAccount = addBenchmarkAccount(state, { username: '@OpenAI', category: 'AI' })
  assert.equal(withAccount.benchmarkAccounts.length, 1)
  const post = normalizeCapturedPost({ id: 'post-1', text: 'AI', created_at: '2026-08-31T08:00:00.000Z' }, null, [], 'benchmark-account', withAccount.benchmarkAccounts[0].id)
  const withPosts = saveCapturedPosts(withAccount, [post], { sourceType: 'benchmark-account', sourceId: withAccount.benchmarkAccounts[0].id, query: '@OpenAI' })
  assert.equal(withPosts.contentLibrary.length, 1)
  assert.equal(withPosts.benchmarkAccounts[0].capturedCount, 1)
  assert.equal(withPosts.captureBatches[0].status, '全部成功')
})

test('collects a captured post with its engagement data into the candidate pool', () => {
  const post = normalizeCapturedPost({ id: 'post-2', text: 'AI market signal', created_at: '2026-08-31T08:00:00.000Z', public_metrics: { like_count: 90, reply_count: 12, retweet_count: 21 } }, { username: 'market_ai' }, [], 'keyword')
  const next = createCandidateFromCapturedPost({ candidatePool: [], activity: [] }, post)
  assert.equal(next.candidatePool[0].id, 'captured-post-2')
  assert.equal(next.candidatePool[0].metrics.likes, 90)
  assert.equal(next.candidatePool[0].author.username, '@market_ai')
  assert.equal(next.candidatePool[0].status, '待分配')
})
