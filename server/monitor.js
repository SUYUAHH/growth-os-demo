import { fetchRecentTweets, isXConfigured } from './xClient.js'
import { getState, updateState } from './store.js'

let timer

function formatTime() {
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date())
}

function demoObservation() {
  const candidates = [
    { title: 'The quiet commute test is picking up', chineseTitle: '安静通勤测试正在升温', source: 'Local signal stream', category: 'Lifestyle', momentum: 79, relevance: 84, views: '1.2M' },
    { title: 'First car, first real adult decision', chineseTitle: '第一台车，也是第一次成年人的选择', source: 'Local signal stream', category: 'Decision', momentum: 83, relevance: 91, views: '920K' },
    { title: 'Tiny car upgrades people actually save', chineseTitle: '大家真的会收藏的小升级', source: 'Local signal stream', category: 'Product', momentum: 76, relevance: 82, views: '680K' },
  ]
  const item = candidates[Math.floor(Date.now() / 60000) % candidates.length]
  return {
    id: `demo-${Math.floor(Date.now() / 60000)}`,
    ...item,
    age: 'just now',
    competition: '低',
    status: '新发现',
    statusTone: 'positive',
    audience: '25-34 · 城市通勤 · 购车决策',
    whyNow: '实时事件流发现相关内容密度上升，账号当前内容结构具备切入空间。',
    gap: '需要把抽象的产品优势翻译成用户可以转发和讨论的生活判断。',
    action: '先收录到候选内容池，再进入爆款拆解验证表达机制。',
    tags: ['实时发现', '低竞争', '可验证'],
    sourcePost: 'The best features are the ones that make an ordinary weekday feel a little easier.',
  }
}

function tweetToTrend(tweet) {
  const text = tweet.text.replace(/\s+/g, ' ').trim()
  const shortTitle = text.length > 58 ? `${text.slice(0, 58)}...` : text
  const likes = tweet.metrics.like_count || 0
  const reposts = tweet.metrics.retweet_count || 0
  return {
    id: `x-${tweet.id}`,
    title: shortTitle,
    chineseTitle: 'X 实时信号 · 等待内容化判断',
    source: `X · ${tweet.author}`,
    age: 'just now',
    momentum: Math.min(99, 60 + Math.round((likes + reposts * 2) / 20)),
    relevance: 78,
    competition: '待判断',
    status: '实时发现',
    statusTone: 'positive',
    category: 'Live signal',
    views: `${(likes + reposts).toLocaleString()} interactions`,
    audience: 'X public conversation',
    whyNow: `来自 X 的实时内容信号，作者 ${tweet.author}，当前互动 ${likes + reposts}。`,
    gap: '需要结合账号定位进行二次判断，避免把单条高互动误判成稳定趋势。',
    action: '查看原文，确认语境和风险后再进入内容拆解。',
    tags: ['X 实时', '需复核', tweet.url],
    sourcePost: text,
    externalUrl: tweet.url,
  }
}

export async function runMonitor(requestedMode, query) {
  const state = await getState()
  const mode = requestedMode || state.monitor.mode || (isXConfigured() ? 'x' : 'demo')
  let observations
  let result

  try {
    if (mode === 'x') {
      const tweets = await fetchRecentTweets(query)
      observations = tweets.map(tweetToTrend)
      result = `X API 返回 ${observations.length} 条实时内容`
    } else {
      observations = [demoObservation()]
      result = '本地事件流新增 1 条可分析信号'
    }
  } catch (error) {
    await updateState((current) => ({ ...current, monitor: { ...current.monitor, lastRunAt: new Date().toISOString(), lastResult: error.message } }))
    throw error
  }

  return updateState((current) => {
    const existingIds = new Set(current.trends.map((trend) => trend.id))
    const fresh = observations.filter((trend) => !existingIds.has(trend.id))
    const nextTrends = [...fresh, ...current.trends].slice(0, 20)
    const now = new Date()
    const nextRun = new Date(now.getTime() + current.monitor.intervalSeconds * 1000)
    return {
      ...current,
      trends: nextTrends,
      activity: fresh.length ? [{ time: formatTime(), text: result, type: 'insight' }, ...current.activity].slice(0, 30) : current.activity,
      monitor: { ...current.monitor, mode, lastRunAt: now.toISOString(), nextRunAt: nextRun.toISOString(), runs: current.monitor.runs + 1, lastResult: result },
    }
  })
}

export async function startMonitor() {
  const current = await updateState((state) => ({ ...state, monitor: { ...state.monitor, enabled: true } }))
  await runMonitor(current.monitor.mode)
  scheduleMonitor()
  return getState()
}

export async function stopMonitor() {
  if (timer) clearInterval(timer)
  timer = undefined
  return updateState((state) => ({ ...state, monitor: { ...state.monitor, enabled: false, nextRunAt: null, lastResult: '监测已暂停' } }))
}

export function scheduleMonitor() {
  if (timer) clearInterval(timer)
  getState().then((state) => {
    if (!state.monitor.enabled) return
    timer = setInterval(() => runMonitor(state.monitor.mode).catch(() => {}), state.monitor.intervalSeconds * 1000)
  })
}
