import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getState, stateFilePath, updateState } from './store.js'
import { isXConfigured, xStatus } from './xClient.js'
import { runMonitor, scheduleMonitor, startMonitor, stopMonitor } from './monitor.js'
import { agentStatus, generateRemix } from './agentEngine.js'
import { completeLeaderTask, createCandidateFromStrategy, createLeaderTask, generateDailyReport } from './growthEngine.js'

const rootDir = join(fileURLToPath(new URL('.', import.meta.url)), '..')

async function loadEnvFile() {
  try {
    const text = await readFile(join(rootDir, '.env'), 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  } catch {
    // .env is optional; the demo mode remains fully runnable without it.
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(data))
}

async function readBody(request) {
  let body = ''
  for await (const chunk of request) body += chunk
  return body ? JSON.parse(body) : {}
}

function publicState(state) {
  return { ...state, x: xStatus(), agent: agentStatus(), stateFile: stateFilePath() }
}

async function handleApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') return sendJson(response, 200, { ok: true, service: 'growth-os-server', now: new Date().toISOString() })
  if (request.method === 'GET' && url.pathname === '/api/state') return sendJson(response, 200, publicState(await getState()))
  if (request.method === 'GET' && url.pathname === '/api/x/status') return sendJson(response, 200, xStatus())
  if (request.method === 'GET' && url.pathname === '/api/agent/status') return sendJson(response, 200, agentStatus())
  if (request.method === 'GET' && url.pathname === '/api/growth/daily-report') {
    const state = await getState()
    return sendJson(response, 200, state.dailyReports?.[0] || null)
  }
  if (request.method === 'POST' && url.pathname === '/api/growth/daily-report') {
    const next = await updateState((state) => generateDailyReport(state))
    return sendJson(response, 201, publicState(next))
  }
  if (request.method === 'POST' && url.pathname === '/api/growth/tasks') {
    try {
      const body = await readBody(request)
      const next = await updateState((state) => createLeaderTask(state, body))
      return sendJson(response, 201, publicState(next))
    } catch (error) { return sendJson(response, 400, { error: error.message }) }
  }
  if (request.method === 'POST' && url.pathname === '/api/growth/tasks/complete') {
    try {
      const { taskId } = await readBody(request)
      const next = await updateState((state) => completeLeaderTask(state, taskId))
      return sendJson(response, 200, publicState(next))
    } catch (error) { return sendJson(response, 400, { error: error.message }) }
  }
  if (request.method === 'POST' && url.pathname === '/api/growth/benchmark/promote') {
    try {
      const { strategyId } = await readBody(request)
      const next = await updateState((state) => createCandidateFromStrategy(state, strategyId))
      return sendJson(response, 201, publicState(next))
    } catch (error) { return sendJson(response, 400, { error: error.message }) }
  }
  if (request.method === 'POST' && url.pathname === '/api/monitor/run') {
    try { const body = await readBody(request); return sendJson(response, 200, publicState(await runMonitor(body.mode, body.query))) } catch (error) { return sendJson(response, error.code === 'X_NOT_CONFIGURED' ? 400 : 502, { error: error.message, x: xStatus() }) }
  }
  if (request.method === 'POST' && url.pathname === '/api/x/ingest') {
    try { const body = await readBody(request); return sendJson(response, 200, publicState(await runMonitor('x', body.query))) } catch (error) { return sendJson(response, error.code === 'X_NOT_CONFIGURED' ? 400 : 502, { error: error.message, x: xStatus() }) }
  }
  if (request.method === 'POST' && url.pathname === '/api/monitor/start') {
    try { return sendJson(response, 200, publicState(await startMonitor())) } catch (error) { return sendJson(response, 502, { error: error.message }) }
  }
  if (request.method === 'POST' && url.pathname === '/api/monitor/stop') return sendJson(response, 200, publicState(await stopMonitor()))
  if (request.method === 'POST' && url.pathname === '/api/assets') {
    const body = await readBody(request)
    const next = await updateState((state) => {
      const asset = { ...body, id: body.id || `asset-${Date.now()}`, status: '待审核', savedAt: new Date().toISOString() }
      const assets = [asset, ...state.assets.filter((item) => item.id !== asset.id)]
      return { ...state, assets, activity: [{ time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), text: '内容资产已保存，进入人工审核队列', type: 'save' }, ...state.activity].slice(0, 30) }
    })
    return sendJson(response, 201, publicState(next))
  }
  if (request.method === 'POST' && url.pathname === '/api/review/queue') {
    const body = await readBody(request)
    if (!body.assetId || !body.draft) return sendJson(response, 400, { error: 'assetId and draft are required' })
    const { assetId, ...assetPayload } = body
    const next = await updateState((state) => {
      const now = new Date().toISOString()
      const existing = state.assets.find((item) => item.id === assetId)
      const { assetId: legacyAssetId, ...existingPayload } = existing || {}
      const asset = { ...existingPayload, ...assetPayload, id: assetId, status: '待审核', reviewQueuedAt: now, savedAt: existing?.savedAt || now }
      return {
        ...state,
        assets: [asset, ...state.assets.filter((item) => item.id !== assetId)],
        activity: [{ time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), text: `内容已进入审核队列：${asset.title || assetId}`, type: 'review' }, ...state.activity].slice(0, 30),
      }
    })
    return sendJson(response, 200, publicState(next))
  }
  if (request.method === 'POST' && url.pathname === '/api/candidates') {
    const { trend } = await readBody(request)
    if (!trend?.id) return sendJson(response, 400, { error: 'trend.id is required' })
    const next = await updateState((state) => {
      const candidate = { id: trend.id, title: trend.title, source: trend.source, status: '待分析', addedAt: new Date().toISOString() }
      const pool = [candidate, ...(state.candidatePool || []).filter((item) => item.id !== candidate.id)].slice(0, 30)
      return { ...state, candidatePool: pool, activity: [{ time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), text: `已收录候选内容：${trend.title}`, type: 'insight' }, ...state.activity].slice(0, 30) }
    })
    return sendJson(response, 201, publicState(next))
  }
  if (request.method === 'POST' && url.pathname === '/api/candidates/status') {
    const { id, status } = await readBody(request)
    const allowed = new Set(['待分析', '已进入拆解', '已忽略'])
    if (!id || !allowed.has(status)) return sendJson(response, 400, { error: 'id and a valid status are required' })
    const next = await updateState((state) => ({ ...state, candidatePool: (state.candidatePool || []).map((item) => item.id === id ? { ...item, status } : item), activity: [{ time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), text: `候选内容状态更新：${status}`, type: 'review' }, ...state.activity].slice(0, 30) }))
    return sendJson(response, 200, publicState(next))
  }
  if (request.method === 'POST' && url.pathname === '/api/analysis/remix') {
    const body = await readBody(request)
    const state = await getState()
    const trend = state.trends.find((item) => item.id === body.trendId) || body.trend
    if (!trend) return sendJson(response, 400, { error: 'trendId or trend is required' })
    try { return sendJson(response, 200, { analysis: await generateRemix(trend, { forceModel: body.forceModel }), agent: agentStatus() }) } catch (error) { return sendJson(response, 502, { error: error.message, agent: agentStatus() }) }
  }
  if (request.method === 'POST' && url.pathname === '/api/actions/complete') {
    const { actionId } = await readBody(request)
    const next = await updateState((state) => ({ ...state, completedActions: state.completedActions.includes(actionId) ? state.completedActions : [...state.completedActions, actionId], activity: [{ time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), text: `发布行动已完成：${actionId}`, type: 'review' }, ...state.activity].slice(0, 30) }))
    return sendJson(response, 200, publicState(next))
  }
  return sendJson(response, 404, { error: 'API route not found' })
}

async function serveStatic(request, response, url) {
  const distPath = join(rootDir, 'dist', url.pathname === '/' ? 'index.html' : url.pathname)
  try {
    const file = await readFile(distPath)
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' }[extname(distPath)] || 'application/octet-stream'
    response.writeHead(200, { 'Content-Type': mime })
    response.end(file)
  } catch {
    const index = await readFile(join(rootDir, 'dist', 'index.html'))
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end(index)
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(request, response, url)
    else await serveStatic(request, response, url)
  } catch (error) {
    sendJson(response, 500, { error: error.message })
  }
})

await loadEnvFile()
const port = Number(process.env.PORT || 8787)
const host = process.env.HOST || '0.0.0.0'
await getState()
scheduleMonitor()
server.listen(port, host, () => console.log(`Growth OS API listening on http://${host}:${port}`))

process.on('SIGINT', () => server.close(() => process.exit(0)))
process.on('SIGTERM', () => server.close(() => process.exit(0)))
