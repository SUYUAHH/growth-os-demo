import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAccountPortfolio,
  completeLeaderTask,
  createCandidateFromStrategy,
  createLeaderTask,
  generateDailyReport,
  filterTrendsByCategory,
  normalizeGrowthState,
} from '../server/growthEngine.js'
import { getSelectedVisibleTrend } from '../src/lib/trendSelection.js'

const baseState = {
  accounts: [{ id: 'account-1', name: 'North Star', health: 68, issue: 'Hook retention is low', action: 'Test a personal opener.' }],
  candidatePool: [],
  activity: [],
}

test('normalizes legacy state with growth intelligence collections', () => {
  const state = normalizeGrowthState(baseState)
  assert.equal(state.leaderTasks.length, 0)
  assert.equal(state.dailyReports.length, 0)
  assert.ok(state.benchmarkStrategies.length >= 1)
  assert.equal(state.accounts[0].issues.length, 1)
})

test('creates and completes a Leader task for a managed account', () => {
  const prepared = normalizeGrowthState(baseState)
  const created = createLeaderTask(prepared, { accountId: 'account-1', title: 'Classify high-intent comments', owner: 'Mia', dueDate: '2026-08-20', metric: 'Topic conversion >= 20%' })
  assert.equal(created.leaderTasks[0].status, '进行中')
  const completed = completeLeaderTask(created, created.leaderTasks[0].id)
  assert.equal(completed.leaderTasks[0].status, '已完成')
})

test('generates a daily report with account priorities and task progress', () => {
  const prepared = normalizeGrowthState(baseState)
  const state = createLeaderTask(prepared, { accountId: 'account-1', title: 'Classify high-intent comments', owner: 'Mia', dueDate: '2026-08-20', metric: 'Topic conversion >= 20%' })
  const reported = generateDailyReport(state)
  assert.equal(reported.dailyReports.length, 1)
  assert.equal(reported.dailyReports[0].priorityIssues.length, 1)
  assert.equal(reported.dailyReports[0].taskProgress.open, 1)
})

test('promotes only a low-risk benchmark strategy to the candidate pool', () => {
  const prepared = normalizeGrowthState(baseState)
  const safe = prepared.benchmarkStrategies.find((strategy) => strategy.expressionSimilarity < 35)
  const promoted = createCandidateFromStrategy(prepared, safe.id)
  assert.equal(promoted.candidatePool[0].strategyId, safe.id)
  const risky = prepared.benchmarkStrategies.find((strategy) => strategy.expressionSimilarity >= 35)
  assert.throws(() => createCandidateFromStrategy(prepared, risky.id), /人工改写/)
})

test('builds an account portfolio with aggregate metrics and connection states', () => {
  const prepared = normalizeGrowthState({
    accounts: [
      { id: 'a', name: 'A', health: 82, issue: 'None', action: 'Keep testing.' },
      { id: 'b', name: 'B', health: 66, issue: 'Retention', action: 'Fix hook.' },
      { id: 'c', name: 'C', health: 74, issue: 'Cadence', action: 'Plan posts.' },
    ],
  })
  const portfolio = buildAccountPortfolio(prepared)
  assert.equal(portfolio.accounts.length, 3)
  assert.ok(portfolio.totals.impressions > 0)
  assert.ok(portfolio.totals.likeRate > 0)
  assert.equal(portfolio.connections['已连接'] + portfolio.connections['待授权'] + portfolio.connections['数据异常'] + portfolio.connections['Token 即将过期'], 3)
  assert.equal(portfolio.health.risk, 1)
})

test('normalizes the three interest categories and filters matching hotspots', () => {
  const state = normalizeGrowthState({
    accounts: [
      { id: 'lifestyle-account', name: 'Lifestyle', health: 80 },
      { id: 'food-account', name: 'Food', health: 80 },
      { id: 'travel-account', name: 'Travel', health: 80 },
    ],
    trends: [
      { id: 'life-trend', title: 'Life', category: 'lifestyle' },
      { id: 'food-trend', title: 'Food', category: 'food' },
      { id: 'travel-trend', title: 'Travel', category: 'travel' },
    ],
  })
  assert.deepEqual(state.accounts.map((item) => item.category), ['lifestyle', 'food', 'travel'])
  assert.deepEqual(state.accounts.map((item) => item.categoryLabel), ['生活方式', '美食餐饮', '旅行户外'])
  assert.deepEqual(filterTrendsByCategory(state.trends, 'food').map((item) => item.id), ['food-trend'])
})

test('migrates legacy automotive strategies and candidates to the current taxonomy', () => {
  const state = normalizeGrowthState({
    accounts: [],
    benchmarkStrategies: [{ id: 'old', benchmark: 'Drive with Maya', title: 'Quiet luxury for your first car' }],
    candidatePool: [{ id: 'old-candidate', title: 'Tiny car upgrades people save', source: 'Local signal stream' }],
  })
  assert.equal(state.benchmarkStrategies.some((item) => /car|luxury|drive/i.test(`${item.title} ${item.benchmark}`)), false)
  assert.equal(state.candidatePool.some((item) => /car|luxury|vehicle/i.test(`${item.title} ${item.source}`)), false)
  assert.ok(state.benchmarkStrategies.every((item) => ['food', 'travel'].includes(item.category)))
})

test('keeps the hotspot detail inside the active category filter', () => {
  const visible = [{ id: 'food-trend' }, { id: 'food-trend-2' }]
  assert.equal(getSelectedVisibleTrend(visible, { id: 'travel-trend' }).id, 'food-trend')
  assert.equal(getSelectedVisibleTrend(visible, { id: 'food-trend-2' }).id, 'food-trend-2')
  assert.equal(getSelectedVisibleTrend([], { id: 'travel-trend' }).id, 'travel-trend')
})
