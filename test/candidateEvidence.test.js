import test from 'node:test'
import assert from 'node:assert/strict'
import * as signals from '../src/lib/candidateEvidence.js'

test('missing evidence stays unknown, never a default probability or zero', () => {
  const result = signals.assessCandidate({})
  assert.equal(result.paid.label, '自然增长倾向')
  assert.ok(result.paid.probability > 0)
  assert.equal(result.metrics.likes, null)
  assert.equal(result.kol.label, '未发现大V/KOL评论')
  assert.equal(result.conversion.label, '暂未产生转化')
})
test('parses metric units and preserves recorded zero', () => {
  const result = signals.assessCandidate({ metrics: { impressions: 120000, likes: 0, replies: 0 }, author: { followers: '8.2K' } })
  assert.equal(result.metrics.followers, 8200)
  assert.equal(result.metrics.likeRate, 0)
  assert.equal(result.paid.label, '疑似投流')
  assert.ok(result.paid.clues.some(x => x.includes('曝光/粉丝')))
})
test('suspicious tag is not verified paid evidence; scoped ad record is', () => {
  assert.equal(signals.assessCandidate({ tags: ['疑似投流'] }).paid.label, '疑似投流')
  assert.equal(signals.assessCandidate({ id: 'p1', paidEvidence: { postId: 'p1', sourceUrl: 'https://example.com/ad', verified: true } }).paid.label, '已投流')
  assert.equal(signals.assessCandidate({ id: 'p1', paidEvidence: { postId: 'p2', sourceUrl: 'https://example.com/ad', verified: true } }).paid.label, '自然增长倾向')
})
test('sampled KOL comments and zero conversions have explicit scope', () => {
  const result = signals.assessCandidate({ commentSamples: [{ author: { followers: '150K' } }, { author: { followers: 20 } }], metrics: { conversions: 0 } })
  assert.equal(result.kol.count, 1)
  assert.equal(result.kol.sampleSize, 2)
  assert.equal(result.conversion.label, '暂未产生转化')
})
test('exposure alone is not topic evidence and large accounts are not low-follower breakouts', () => {
  const result = signals.assessCandidate({ author: { followers: 1000000 }, metrics: { impressions: 10000000 } })
  assert.equal(result.topic.label, '未发现明显话题趋势')
  assert.notEqual(result.contentLabel, '低粉爆款')
})
