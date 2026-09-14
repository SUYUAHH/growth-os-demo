import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateHotspotSignal } from '../src/lib/candidatePaidSignals.js'

test('raises hotspot probability when content carries a trend signal', () => {
  const result = evaluateHotspotSignal({}, { tags: ['热点事件'], views: '120K', followers: '10K' })
  assert.equal(result.label, '高概率蹭热点')
  assert.ok(result.probability >= 70)
})

test('keeps ordinary content at low hotspot probability', () => {
  const result = evaluateHotspotSignal({}, { tags: ['生活方式'], views: '20K', followers: '15K' })
  assert.equal(result.label, '未发现明显蹭热点')
  assert.ok(result.probability < 40)
})
