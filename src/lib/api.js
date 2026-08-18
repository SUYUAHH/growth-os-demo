async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || `Request failed: ${response.status}`)
  return payload
}

export const getState = () => request('/api/state')
export const runMonitor = (mode) => request('/api/monitor/run', { method: 'POST', body: JSON.stringify({ mode }) })
export const startMonitor = () => request('/api/monitor/start', { method: 'POST' })
export const stopMonitor = () => request('/api/monitor/stop', { method: 'POST' })
export const saveAsset = (asset) => request('/api/assets', { method: 'POST', body: JSON.stringify(asset) })
export const queueReview = (asset) => request('/api/review/queue', { method: 'POST', body: JSON.stringify(asset) })
export const completeAction = (actionId) => request('/api/actions/complete', { method: 'POST', body: JSON.stringify({ actionId }) })
export const addCandidate = (trend) => request('/api/candidates', { method: 'POST', body: JSON.stringify({ trend }) })
export const updateCandidate = (id, status) => request('/api/candidates/status', { method: 'POST', body: JSON.stringify({ id, status }) })
export const generateRemix = (trendId, forceModel = false) => request('/api/analysis/remix', { method: 'POST', body: JSON.stringify({ trendId, forceModel }) })
export const generateDailyReport = () => request('/api/growth/daily-report', { method: 'POST' })
export const createLeaderTask = (task) => request('/api/growth/tasks', { method: 'POST', body: JSON.stringify(task) })
export const completeLeaderTask = (taskId) => request('/api/growth/tasks/complete', { method: 'POST', body: JSON.stringify({ taskId }) })
export const promoteBenchmarkStrategy = (strategyId) => request('/api/growth/benchmark/promote', { method: 'POST', body: JSON.stringify({ strategyId }) })
