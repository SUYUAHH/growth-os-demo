import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluatePaidReadiness, getPaidObjectiveRule } from '../src/lib/paidDistributionRules.js'

const eligibleTrend = { followers: '80K', views: '2.4M', likeRate: '8.2%', comments: '4.1K', tags: [] }

test('holds X paid distribution behind a natural-growth gate', () => {
  const result = evaluatePaidReadiness(eligibleTrend, false)

  assert.equal(result.decision, '先自然测试')
  assert.equal(result.canApply, false)
  assert.ok(result.missingData.includes('自然测试结果'))
  assert.equal(result.manualReview, true)
})

test('allows a small-budget application only after evidence and natural test gates pass', () => {
  const result = evaluatePaidReadiness(eligibleTrend, true)

  assert.equal(result.decision, '人工审核后小预算')
  assert.equal(result.canApply, true)
  assert.ok(result.evidence.some((item) => item.includes('点赞率')))
  assert.ok(result.testPlan.budgetCap)
  assert.ok(result.testPlan.stopConditions.length >= 2)
})

test('blocks paid distribution when X content has a material risk signal', () => {
  const result = evaluatePaidReadiness({ ...eligibleTrend, tags: ['版权待核验'] }, true)

  assert.equal(result.decision, '禁止投流')
  assert.equal(result.canApply, false)
  assert.equal(result.gate, '风险前置拦截')
})

test('keeps objective-specific success and post-test metrics explicit', () => {
  const rule = getPaidObjectiveRule('线索收集')

  assert.match(rule.strategy, /小预算/)
  assert.match(rule.success, /有效线索率/)
  assert.match(rule.track, /CPL/)
})
