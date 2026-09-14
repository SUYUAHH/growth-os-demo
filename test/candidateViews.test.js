import test from 'node:test'
import assert from 'node:assert/strict'
import { filterCandidates } from '../src/lib/candidateViews.js'

test('deduplicates repeated candidate records before rendering the operator view', () => {
  const candidates = [
    { id: 'candidate-1', title: '同一条 X 内容', status: '待拆解', addedAt: '2026-09-11T10:00:00.000Z' },
    { id: 'candidate-1', title: '同一条 X 内容', status: '待审核', addedAt: '2026-09-11T11:00:00.000Z' },
    { id: 'candidate-2', title: '另一条内容', status: '待拆解', addedAt: '2026-09-11T09:00:00.000Z' },
  ]

  const visible = filterCandidates(candidates, { accountId: 'all' })

  assert.deepEqual(visible.map((candidate) => candidate.id), ['candidate-1', 'candidate-2'])
  assert.equal(visible[0].status, '待审核')
})
