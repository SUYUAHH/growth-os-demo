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
export const assignCandidate = (id, accountId) => request('/api/candidates/assign', { method: 'POST', body: JSON.stringify({ id, accountId }) })
export const transitionAsset = (id, status) => request('/api/assets/status', { method: 'POST', body: JSON.stringify({ id, status }) })
export const prepareAssetForPublish = (id, input) => request('/api/assets/prepare', { method: 'POST', body: JSON.stringify({ id, ...input }) })
export const recordPublishedPerformance = (assetId, metrics) => request('/api/assets/performance', { method: 'POST', body: JSON.stringify({ assetId, metrics }) })
export const transitionCandidate = (id, status) => request('/api/candidates/transition', { method: 'POST', body: JSON.stringify({ id, status }) })
export const reviewKnowledgeRule = (candidateId, review) => request('/api/knowledge/review', { method: 'POST', body: JSON.stringify({ candidateId, review }) })
export const generateRemix = (trendId, forceModel = false) => request('/api/analysis/remix', { method: 'POST', body: JSON.stringify({ trendId, forceModel }) })
export const generateDailyReport = () => request('/api/growth/daily-report', { method: 'POST' })
export const createLeaderTask = (task) => request('/api/growth/tasks', { method: 'POST', body: JSON.stringify(task) })
export const completeLeaderTask = (taskId) => request('/api/growth/tasks/complete', { method: 'POST', body: JSON.stringify({ taskId }) })
export const promoteBenchmarkStrategy = (strategyId) => request('/api/growth/benchmark/promote', { method: 'POST', body: JSON.stringify({ strategyId }) })
export const captureKeywords = (payload) => request('/api/capture/keywords', { method: 'POST', body: JSON.stringify(payload) })
export const addBenchmarkAccount = (payload) => request('/api/benchmark-accounts', { method: 'POST', body: JSON.stringify(payload) })
export const captureBenchmarkAccount = (accountId) => request('/api/benchmark-accounts/capture', { method: 'POST', body: JSON.stringify({ accountId }) })
export const collectCapturedPost = (postId) => request('/api/capture/collect', { method: 'POST', body: JSON.stringify({ postId }) })
