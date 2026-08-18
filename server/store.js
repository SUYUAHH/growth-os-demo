import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { activity as seedActivity, managedAccounts, trends } from '../src/data/mockData.js'
import { normalizeGrowthState } from './growthEngine.js'

const serverDir = dirname(fileURLToPath(import.meta.url))

export function resolveStateFilePath(stateDir = process.env.STATE_DIR) {
  return join(stateDir || join(serverDir, 'data'), 'state.json')
}

const statePath = resolveStateFilePath()

const initialState = () => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  trends,
  accounts: managedAccounts,
  candidatePool: [],
  assets: [],
  completedActions: [],
  activity: seedActivity,
  monitor: {
    enabled: true,
    mode: process.env.X_BEARER_TOKEN ? 'x' : 'demo',
    intervalSeconds: Number(process.env.MONITOR_INTERVAL_SECONDS || 60),
    lastRunAt: null,
    nextRunAt: null,
    runs: 0,
    lastResult: '等待第一次监测',
  },
})

let state

export async function getState() {
  if (state) return state
  await mkdir(dirname(statePath), { recursive: true })
  try {
    state = JSON.parse(await readFile(statePath, 'utf8'))
  } catch {
    state = initialState()
    await persist()
  }
  state = normalizeGrowthState(state)
  if (process.env.X_BEARER_TOKEN && state.monitor?.mode === 'demo') state.monitor.mode = 'x'
  return state
}

export async function updateState(mutator) {
  const current = await getState()
  const next = await mutator(current)
  state = next || current
  state.updatedAt = new Date().toISOString()
  await persist()
  return state
}

export async function persist() {
  await mkdir(dirname(statePath), { recursive: true })
  await writeFile(statePath, JSON.stringify(state, null, 2), 'utf8')
}

export function stateFilePath() {
  return statePath
}
