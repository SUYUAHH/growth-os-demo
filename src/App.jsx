import { useEffect, useState } from 'react'
import {
  Activity,
  Bell,
  ChevronRight,
  CircleHelp,
  Command,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react'
import { account, concepts, navItems, trends } from './data/mockData'
import Intelligence from './modules/Intelligence'
import Dashboard from './modules/Dashboard'
import Remix from './modules/Remix'
import Distribution from './modules/Distribution'
import { addCandidate, completeAction as completeActionRequest, completeLeaderTask as completeLeaderTaskRequest, createLeaderTask as createLeaderTaskRequest, generateDailyReport as generateDailyReportRequest, generateRemix, getState, promoteBenchmarkStrategy, queueReview, runMonitor, saveAsset as saveAssetRequest, startMonitor, stopMonitor, updateCandidate } from './lib/api'

function App() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [focusedAccountId, setFocusedAccountId] = useState(null)
  const [selectedTrend, setSelectedTrend] = useState(trends[0])
  const [activeConceptId, setActiveConceptId] = useState(concepts[0].id)
  const [draft, setDraft] = useState(concepts[0].draft)
  const [savedConcepts, setSavedConcepts] = useState([])
  const [completedActions, setCompletedActions] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toast, setToast] = useState('')
  const [serverState, setServerState] = useState(null)
  const [serverOnline, setServerOnline] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [remixResult, setRemixResult] = useState(null)
  const [remixGenerating, setRemixGenerating] = useState(false)
  useEffect(() => {
    let mounted = true
    const sync = async () => {
      try {
        const next = await getState()
        if (!mounted) return
        setServerState(next)
        setServerOnline(true)
        setSavedConcepts(next.assets?.map((asset) => asset.id) || [])
        setCompletedActions(next.completedActions || [])
        setSelectedTrend((current) => next.trends?.some((trend) => trend.id === current.id) ? current : next.trends?.[0] || current)
      } catch {
        if (mounted) setServerOnline(false)
      }
    }
    sync()
    const interval = window.setInterval(sync, 15000)
    return () => { mounted = false; window.clearInterval(interval) }
  }, [])

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(window.__growthToast)
    window.__growthToast = window.setTimeout(() => setToast(''), 2600)
  }

  const openTrend = (trend) => {
    setSelectedTrend(trend)
    showToast(`已切换到「${trend.chineseTitle}」`)
  }

  const openRemix = (trend = selectedTrend) => {
    setSelectedTrend(trend)
    setRemixResult(null)
    setActiveModule('remix')
    showToast('已将机会信号带入二创工作台')
  }

  const openAccountCockpit = (accountId) => {
    if (!accountId) return
    setFocusedAccountId(accountId)
    setActiveModule('intelligence')
    showToast('已进入该账号的经营驾驶舱')
  }

  const selectConcept = (concept) => {
    setActiveConceptId(concept.id)
    setDraft(concept.draft)
  }

  const saveConcept = async () => {
    if (!savedConcepts.includes(activeConceptId)) {
      setSavedConcepts((current) => [...current, activeConceptId])
    }
    try {
      const concept = (remixResult?.concepts || concepts).find((item) => item.id === activeConceptId) || (remixResult?.concepts || concepts)[0]
      const next = await saveAssetRequest({ id: activeConceptId, title: concept?.title, draft, trendId: selectedTrend.id, source: 'Viral Remix Studio' })
      setServerState(next)
      setServerOnline(true)
      showToast('内容已保存到资产库，状态：待审核')
    } catch {
      showToast('本地已保存；API 服务未连接')
    }
  }

  const handleAddCandidate = async (trend) => {
    try {
      const next = await addCandidate(trend)
      setServerState(next)
      setServerOnline(true)
      showToast('已收录到候选内容池，等待分析')
    } catch {
      showToast('候选内容已在当前页面标记，API 服务未连接')
    }
  }

  const handleGenerateRemix = async (forceModel = false) => {
    setRemixGenerating(true)
    try {
      const response = await generateRemix(selectedTrend.id, forceModel)
      setRemixResult(response.analysis)
      setActiveConceptId(response.analysis.concepts?.[0]?.id || concepts[0].id)
      setDraft(response.analysis.draft || response.analysis.concepts?.[0]?.draft || concepts[0].draft)
      showToast(response.agent?.provider === 'model' ? '模型生成完成，已通过结构化校验' : '本地规则引擎生成完成')
    } catch (error) {
      showToast(error.message || '生成失败，请检查模型服务')
    } finally {
      setRemixGenerating(false)
    }
  }

  const handleCandidateStatus = async (id, status) => {
    try {
      const next = await updateCandidate(id, status)
      setServerState(next)
      setServerOnline(true)
      showToast(`候选内容已更新为：${status}`)
    } catch (error) {
      showToast(error.message || '候选内容状态更新失败')
    }
  }

  const handleGenerateDailyReport = async () => {
    try {
      const next = await generateDailyReportRequest()
      setServerState(next)
      setServerOnline(true)
      showToast('Leader 每日报告已生成，已汇总风险和任务进度')
    } catch (error) {
      showToast(error.message || '生成每日报告失败')
    }
  }

  const handleCreateLeaderTask = async (accountItem, issue) => {
    try {
      const dueDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
      const next = await createLeaderTaskRequest({ accountId: accountItem.id, title: `跟进：${issue.title}`, owner: 'Content Ops', dueDate, metric: `验证 ${issue.evidence} 是否改善` })
      setServerState(next)
      setServerOnline(true)
      showToast('首要问题已转为 Leader 行动任务')
    } catch (error) {
      showToast(error.message || '创建 Leader 任务失败')
    }
  }

  const handleCompleteLeaderTask = async (taskId) => {
    try {
      const next = await completeLeaderTaskRequest(taskId)
      setServerState(next)
      setServerOnline(true)
      showToast('Leader 任务已完成，等待下次日报验证改善')
    } catch (error) {
      showToast(error.message || '更新 Leader 任务失败')
    }
  }

  const handlePromoteStrategy = async (strategyId) => {
    try {
      const next = await promoteBenchmarkStrategy(strategyId)
      setServerState(next)
      setServerOnline(true)
      showToast('低风险对标策略已加入候选内容池')
    } catch (error) {
      showToast(error.message || '策略暂不能进入候选池')
    }
  }

  const completeAction = async (actionId) => {
    setCompletedActions((current) => current.includes(actionId) ? current : [...current, actionId])
    try {
      const next = await completeActionRequest(actionId)
      setServerState(next)
      setServerOnline(true)
      showToast('建议已标记为完成，复盘链路已更新')
    } catch {
      showToast('本地已完成；API 服务未连接')
    }
  }

  const handleQueueReview = async () => {
    try {
      const concept = (remixResult?.concepts || concepts).find((item) => item.id === activeConceptId) || (remixResult?.concepts || concepts)[0]
      const next = await queueReview({ assetId: activeConceptId, title: concept?.title, draft, trendId: selectedTrend.id, channel: 'TikTok', source: 'Viral Remix Studio' })
      setServerState(next)
      setServerOnline(true)
      setSavedConcepts((current) => current.includes(activeConceptId) ? current : [...current, activeConceptId])
      showToast('内容已进入审核队列，等待人工确认')
    } catch (error) {
      showToast(error.message || '进入审核队列失败')
    }
  }

  const handleRunMonitor = async () => {
    setSyncing(true)
    try {
      const next = await runMonitor(serverState?.monitor?.mode)
      setServerState(next)
      setServerOnline(true)
      if (next.trends?.[0]) setSelectedTrend(next.trends[0])
      showToast(next.monitor.lastResult || '监测已完成')
    } catch (error) {
      showToast(error.message || '监测失败，请检查服务配置')
    } finally {
      setSyncing(false)
    }
  }

  const handleMonitorToggle = async () => {
    try {
      const next = serverState?.monitor?.enabled ? await stopMonitor() : await startMonitor()
      setServerState(next)
      setServerOnline(true)
      showToast(next.monitor.enabled ? '实时监测已开启' : '实时监测已暂停')
    } catch (error) {
      showToast(error.message || '监测状态更新失败')
    }
  }

  const activeItem = navItems.find((item) => item.id === activeModule)
  const liveTrends = serverState?.trends?.length ? serverState.trends : trends
  const monitor = serverState?.monitor || { enabled: false, mode: 'demo', lastResult: '等待 API 服务' }

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><Sparkles size={17} strokeWidth={2.2} /></div>
          <div className="brand-copy">
            <strong>GROWTH OS</strong>
            <span>AI CONTENT OPERATIONS</span>
          </div>
          <button className="icon-button sidebar-toggle" onClick={() => setSidebarOpen(false)} aria-label="收起侧栏" title="收起侧栏">
            <PanelLeftClose size={16} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <div className="account-switcher">
          <div className="account-avatar">{account.avatar}</div>
          <div className="account-copy"><strong>{account.name}</strong><span>{account.handle}</span></div>
          <ChevronRight size={15} className="muted-icon" />
        </div>

        <nav className="main-nav" aria-label="主导航">
          <div className="nav-section-title">OPERATIONS</div>
          {navItems.map((item) => {
            const Icon = item.id === 'dashboard' ? LayoutDashboard : item.id === 'intelligence' ? Activity : Sparkles
            return (
              <button key={item.id} className={`nav-item ${activeModule === item.id ? 'nav-active' : ''}`} onClick={() => setActiveModule(item.id)}>
                <span className="nav-icon"><Icon size={17} /></span>
                <span className="nav-text"><strong>{item.label}</strong><small>{item.description}</small></span>
                {activeModule === item.id && <span className="nav-live-dot" />}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-spacer" />
        <div className="agent-status">
          <div className="status-orbit"><span /></div>
          <div><strong>3 Agents ready</strong><span>Data synced 09:42</span></div>
          <CircleHelp size={15} className="muted-icon" />
        </div>
        <div className="sidebar-footer"><span>DEMO ENVIRONMENT</span><span>v0.1.0</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && <button className="icon-button" onClick={() => setSidebarOpen(true)} aria-label="展开侧栏" title="展开侧栏"><PanelLeftOpen size={17} /></button>}
            <button className="mobile-menu icon-button" onClick={() => setSidebarOpen((current) => !current)} aria-label="打开导航"><Menu size={18} /></button>
            <div className="breadcrumbs"><span>WORKSPACE</span><ChevronRight size={13} /><strong>{activeItem?.label}</strong></div>
          </div>
          <div className="topbar-actions">
            <button className={`sync-chip monitor-chip ${monitor.enabled ? 'monitor-on' : 'monitor-off'}`} onClick={handleMonitorToggle} title="切换后台实时监测"><span className="sync-dot" /> {monitor.enabled ? 'MONITOR ON' : 'MONITOR OFF'} · {serverOnline ? monitor.mode.toUpperCase() : 'OFFLINE'}</button>
            <button className="icon-button" aria-label="通知" title="通知"><Bell size={17} /></button>
            <div className="profile-chip"><span className="profile-avatar">SY</span><span className="profile-name">Operator</span><ChevronRight size={13} /></div>
          </div>
        </header>

        <div className="mobile-nav-row">
          {navItems.map((item) => <button key={item.id} className={activeModule === item.id ? 'mobile-nav-active' : ''} onClick={() => setActiveModule(item.id)}>{item.label}</button>)}
        </div>

        <div className="page-wrap">
          {activeModule === 'dashboard' && <Dashboard accounts={serverState?.accounts} candidateCount={serverState?.candidatePool?.length || 0} assets={serverState?.assets} leaderTasks={serverState?.leaderTasks} activity={serverState?.activity} onOpenAccount={openAccountCockpit} onDemoAction={showToast} />}
          {activeModule === 'intelligence' && <Intelligence trends={liveTrends} selectedTrend={selectedTrend} onSelectTrend={openTrend} onOpenRemix={openRemix} onAddCandidate={handleAddCandidate} onCandidateStatus={handleCandidateStatus} candidatePool={serverState?.candidatePool} candidateCount={serverState?.candidatePool?.length || 0} onRefresh={handleRunMonitor} syncing={syncing} managedAccounts={serverState?.accounts} focusedAccountId={focusedAccountId} leaderTasks={serverState?.leaderTasks} dailyReports={serverState?.dailyReports} benchmarkStrategies={serverState?.benchmarkStrategies} onGenerateReport={handleGenerateDailyReport} onCreateLeaderTask={handleCreateLeaderTask} onCompleteLeaderTask={handleCompleteLeaderTask} onPromoteStrategy={handlePromoteStrategy} />}
          {activeModule === 'remix' && <Remix trend={selectedTrend} activeConceptId={activeConceptId} draft={draft} savedConcepts={savedConcepts} generated={remixResult} generating={remixGenerating} onGenerate={handleGenerateRemix} onSelectConcept={selectConcept} onDraftChange={setDraft} onSave={saveConcept} onOpenDistribution={() => setActiveModule('distribution')} />}
          {activeModule === 'distribution' && <Distribution trend={selectedTrend} draft={draft} completedActions={completedActions} onComplete={completeAction} onQueueReview={handleQueueReview} onOpenRemix={() => setActiveModule('remix')} activity={serverState?.activity} />}
        </div>
      </main>

      {toast && <div className="toast"><span className="toast-icon"><Command size={14} /></span>{toast}</div>}
    </div>
  )
}

export default App
