import { useEffect, useState } from 'react'
import {
  Activity,
  Bell,
  ChevronRight,
  CircleHelp,
  Command,
  LayoutDashboard,
  Languages,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react'
import { account, concepts, managedAccounts, navItems, trends } from './data/mockData'
import Intelligence from './modules/Intelligence'
import Dashboard from './modules/Dashboard'
import Remix from './modules/Remix'
import Distribution from './modules/Distribution'
import CaptureWorkbench from './components/CaptureWorkbench'
import Assets from './modules/Assets'
import { addBenchmarkAccount as addBenchmarkAccountRequest, addCandidate, assignCandidate as assignCandidateRequest, captureBenchmarkAccount, captureKeywords, collectCapturedPost, completeAction as completeActionRequest, completeLeaderTask as completeLeaderTaskRequest, createLeaderTask as createLeaderTaskRequest, generateDailyReport as generateDailyReportRequest, generateRemix, getState, prepareAssetForPublish as prepareAssetForPublishRequest, promoteBenchmarkStrategy, queueReview, recordPublishedPerformance as recordPublishedPerformanceRequest, reviewKnowledgeRule, runMonitor, saveAsset as saveAssetRequest, startMonitor, stopMonitor, transitionAsset as transitionAssetRequest, updateCandidate } from './lib/api'
import { getInterfaceCopy, navLabels, uiText } from './lib/i18n'

function createLocalCandidate(trend, accounts) {
  const targetAccount = accounts.find((item) => item.category === trend.category)
  return {
    id: `local-${trend.id}`,
    postId: trend.id,
    title: trend.title,
    source: trend.source,
    category: trend.category,
    categoryLabel: trend.categoryLabel,
    categoryKey: trend.categoryKey,
    accountId: targetAccount?.id || null,
    accountName: targetAccount?.name || '未分配账号',
    poolScope: targetAccount ? 'account' : 'global',
    status: targetAccount ? '待拆解' : '待分配',
    addedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    author: { followers: trend.followers },
    metrics: { likes: trend.likes, replies: trend.comments, impressions: trend.views },
    media: trend.media || [],
    statusHistory: [{ status: targetAccount ? '待拆解' : '待分配', at: new Date().toISOString(), actor: 'operator' }],
    ruleReviews: [],
  }
}

function App() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [focusedAccountId, setFocusedAccountId] = useState(null)
  const [selectedTrend, setSelectedTrend] = useState(trends[0])
  const [activeConceptId, setActiveConceptId] = useState(concepts[0].id)
  const [draft, setDraft] = useState(concepts[0].draft)
  const [savedConcepts, setSavedConcepts] = useState([])
  const [completedActions, setCompletedActions] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 760)
  const [toast, setToast] = useState('')
  const [serverState, setServerState] = useState(null)
  const [serverOnline, setServerOnline] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [remixResult, setRemixResult] = useState(null)
  const [remixGenerating, setRemixGenerating] = useState(false)
  const [language, setLanguage] = useState(() => window.localStorage.getItem('growth-os-language') || 'original')
  useEffect(() => {
    const root = document.querySelector('.app-shell')
    if (!root || language !== 'zh') return undefined
    const translate = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const nodes = []
      let node
      while ((node = walker.nextNode())) nodes.push(node)
      nodes.forEach((textNode) => {
        const value = textNode.nodeValue.trim()
        if (!value || textNode.parentElement?.closest('.account-copy, .signal-title, .detail-en, .source-post, textarea, input')) return
        const translated = uiText(value, language)
        if (translated !== value) textNode.nodeValue = textNode.nodeValue.replace(value, translated)
      })
    }
    translate()
    const observer = new MutationObserver(translate)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [language, activeModule, serverState, selectedTrend, remixResult, completedActions])
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
    const currentAccounts = serverState?.accounts?.length ? serverState.accounts : managedAccounts
    const localCandidate = createLocalCandidate(trend, currentAccounts)
    try {
      const next = await addCandidate(trend)
      setServerState(next)
      setServerOnline(true)
      showToast(`已自动归入「${next.candidatePool?.find((item) => item.postId === trend.id || item.id === trend.id)?.accountName || '对应账号'}」候选池`)
    } catch {
      setServerState((current) => ({
        ...(current || { accounts: currentAccounts, trends, assets: [], activity: [], completedActions: [] }),
        candidatePool: [localCandidate, ...((current?.candidatePool || []).filter((item) => item.postId !== trend.id && item.id !== localCandidate.id))],
      }))
      showToast(`已自动归入「${localCandidate.accountName}」候选池（本地演示）`)
    }
  }

  const handleCaptureKeywords = async (payload) => {
    try { const next = await captureKeywords(payload); setServerState(next); setServerOnline(true); showToast(`关键词抓取完成，共 ${next.captureBatches?.[0]?.count || 0} 条`) } catch (error) { showToast(error.message || '关键词抓取失败') }
  }

  const handleAddBenchmarkAccount = async (payload) => {
    try { const next = await addBenchmarkAccountRequest(payload); setServerState(next); setServerOnline(true); showToast(`已收录对标账号：${payload.username}`) } catch (error) { showToast(error.message || '对标账号收录失败') }
  }

  const handleCaptureBenchmarkAccount = async (accountId) => {
    try { const next = await captureBenchmarkAccount(accountId); setServerState(next); setServerOnline(true); showToast(`对标账号抓取完成，共 ${next.captureBatches?.[0]?.count || 0} 条`) } catch (error) { showToast(error.message || '对标账号抓取失败') }
  }

  const handleCollectCapturedPost = async (postId) => {
    try { const next = await collectCapturedPost(postId); setServerState(next); setServerOnline(true); showToast('抓取内容已进入候选收录池') } catch (error) { showToast(error.message || '内容收录失败') }
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
    const normalizedStatus = { '待分析': '待拆解', '已进入拆解': '拆解中', '已忽略': '已归档' }[status] || status
    try {
      const next = await updateCandidate(id, normalizedStatus)
      setServerState(next)
      setServerOnline(true)
      showToast(`候选内容已更新为：${normalizedStatus}`)
    } catch (error) {
      showToast(error.message || '候选内容状态更新失败')
    }
  }

  const handleAssignCandidate = async (id, accountId) => {
    try { const next = await assignCandidateRequest(id, accountId); setServerState(next); setServerOnline(true); showToast('候选内容已归属到账号候选池') } catch (error) { showToast(error.message || '候选内容分配失败') }
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

  const handleCreateContentAsset = async (payload) => {
    try { const next = await saveAssetRequest(payload); setServerState(next); setServerOnline(true); showToast('内容资产已创建，进入待审核') } catch (error) { showToast(error.message || '创建内容资产失败') }
  }

  const handleTransitionAsset = async (id, status) => {
    try { const next = await transitionAssetRequest(id, status); setServerState(next); setServerOnline(true); showToast(`资产已更新为：${status}`) } catch (error) { showToast(error.message || '资产状态更新失败') }
  }

  const handlePrepareAsset = async (id, input) => {
    try { const next = await prepareAssetForPublishRequest(id, input); setServerState(next); setServerOnline(true); showToast('发布准备已保存') } catch (error) { showToast(error.message || '发布准备保存失败') }
  }

  const handleRecordPublishedPerformance = async (id, metrics) => {
    try { const next = await recordPublishedPerformanceRequest(id, metrics); setServerState(next); setServerOnline(true); showToast('真实发布数据已回流，复盘结论已生成') } catch (error) { showToast(error.message || '发布数据保存失败') }
  }

  const handleReviewKnowledgeRule = async (candidateId, review) => {
    try { const next = await reviewKnowledgeRule(candidateId, review); setServerState(next); setServerOnline(true); showToast(`规则审核已保存：${review.status}`) } catch (error) { showToast(error.message || '规则审核保存失败') }
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

  const copy = getInterfaceCopy(language)
  const translatedNavItems = navItems.map((item) => ({ ...item, ...(navLabels[language === 'zh' ? 'zh' : 'original'][item.id] || {}) }))
  const activeItem = translatedNavItems.find((item) => item.id === activeModule)
  const toggleLanguage = (nextLanguage) => {
    setLanguage(nextLanguage)
    window.localStorage.setItem('growth-os-language', nextLanguage)
    showToast(nextLanguage === 'zh' ? '界面已切换为中文' : 'Interface restored to original language')
    window.setTimeout(() => window.location.reload(), 0)
  }

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

        <div className="workspace-label">{copy.workspace}</div>
        <div className="account-switcher">
          <div className="account-avatar">{account.avatar}</div>
          <div className="account-copy"><strong>{account.name}</strong><span>{account.handle}</span></div>
          <ChevronRight size={15} className="muted-icon" />
        </div>

        <nav className="main-nav" aria-label="主导航">
          <div className="nav-section-title">{copy.operations}</div>
          {translatedNavItems.map((item) => {
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

        <div className="language-switcher" aria-label={copy.language}>
          <div className="language-switcher-head"><Languages size={14} /><span>{copy.language}</span><span className="language-hint">{language === 'zh' ? copy.translationHint : 'EN'}</span></div>
          <div className="language-options" role="group" aria-label={copy.toggleLabel}>
            <button className={language === 'original' ? 'language-active' : ''} onClick={() => toggleLanguage('original')} aria-pressed={language === 'original'}>{copy.original}</button>
            <button className={language === 'zh' ? 'language-active' : ''} onClick={() => toggleLanguage('zh')} aria-pressed={language === 'zh'}>{copy.translated}</button>
          </div>
        </div>

        <div className="sidebar-spacer" />
        <div className="agent-status">
          <div className="status-orbit"><span /></div>
          <div><strong>{copy.agentReady}</strong><span>{copy.synced}</span></div>
          <CircleHelp size={15} className="muted-icon" />
        </div>
        <div className="sidebar-footer"><span>{copy.environment}</span><span>v0.1.0</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && <button className="icon-button" onClick={() => setSidebarOpen(true)} aria-label={copy.expanded} title={copy.expanded}><PanelLeftOpen size={17} /></button>}
            <button className="mobile-menu icon-button" onClick={() => setSidebarOpen((current) => !current)} aria-label={copy.openNavigation}><Menu size={18} /></button>
            <div className="breadcrumbs"><span>{copy.workspace}</span><ChevronRight size={13} /><strong>{activeItem?.label}</strong></div>
          </div>
          <div className="topbar-actions">
            <button className={`sync-chip monitor-chip ${monitor.enabled ? 'monitor-on' : 'monitor-off'}`} onClick={handleMonitorToggle} title="切换后台实时监测"><span className="sync-dot" /> {monitor.enabled ? copy.monitorOn : copy.monitorOff} · {serverOnline ? monitor.mode.toUpperCase() : 'OFFLINE'}</button>
            <button className="icon-button" aria-label={copy.notifications} title={copy.notifications}><Bell size={17} /></button>
            <div className="profile-chip"><span className="profile-avatar">SY</span><span className="profile-name">{copy.operator}</span><ChevronRight size={13} /></div>
          </div>
        </header>

        <div className="mobile-nav-row">
          {translatedNavItems.map((item) => <button key={item.id} className={activeModule === item.id ? 'mobile-nav-active' : ''} onClick={() => setActiveModule(item.id)}>{item.label}</button>)}
        </div>

        <div className="page-wrap">
          {activeModule === 'dashboard' && <Dashboard language={language} accounts={serverState?.accounts} candidateCount={serverState?.candidatePool?.length || 0} assets={serverState?.assets} leaderTasks={serverState?.leaderTasks} activity={serverState?.activity} onOpenAccount={openAccountCockpit} onDemoAction={showToast} />}
          {activeModule === 'intelligence' && <><CaptureWorkbench state={serverState} candidateCount={serverState?.candidatePool?.length || 0} onCaptureKeywords={handleCaptureKeywords} onAddAccount={handleAddBenchmarkAccount} onCaptureAccount={handleCaptureBenchmarkAccount} onCollectPost={handleCollectCapturedPost} onOpenPost={(url) => window.open(url, '_blank', 'noopener,noreferrer')} /><Intelligence language={language} trends={liveTrends} selectedTrend={selectedTrend} onSelectTrend={openTrend} onOpenRemix={openRemix} onAddCandidate={handleAddCandidate} onCandidateStatus={handleCandidateStatus} onAssignCandidate={handleAssignCandidate} candidatePool={serverState?.candidatePool} candidateCount={serverState?.candidatePool?.length || 0} onRefresh={handleRunMonitor} syncing={syncing} managedAccounts={serverState?.accounts} focusedAccountId={focusedAccountId} leaderTasks={serverState?.leaderTasks} dailyReports={serverState?.dailyReports} benchmarkStrategies={serverState?.benchmarkStrategies} onGenerateReport={handleGenerateDailyReport} onCreateLeaderTask={handleCreateLeaderTask} onCompleteLeaderTask={handleCompleteLeaderTask} onPromoteStrategy={handlePromoteStrategy} /></>}
          {activeModule === 'remix' && <Remix language={language} trend={selectedTrend} activeConceptId={activeConceptId} draft={draft} savedConcepts={savedConcepts} generated={remixResult} generating={remixGenerating} candidates={serverState?.candidatePool || []} onReviewKnowledgeRule={handleReviewKnowledgeRule} onToast={showToast} onGenerate={handleGenerateRemix} onSelectConcept={selectConcept} onDraftChange={setDraft} onSave={saveConcept} onOpenDistribution={() => setActiveModule('distribution')} />}
          {activeModule === 'distribution' && <Distribution language={language} trend={selectedTrend} draft={draft} completedActions={completedActions} onComplete={completeAction} onQueueReview={handleQueueReview} onOpenRemix={() => setActiveModule('remix')} activity={serverState?.activity} />}
          {activeModule === 'assets' && <Assets assets={serverState?.assets || []} candidates={serverState?.candidatePool || []} accounts={serverState?.accounts || []} onCreate={handleCreateContentAsset} onPrepare={handlePrepareAsset} onTransition={handleTransitionAsset} onPerformance={handleRecordPublishedPerformance} onToast={showToast} />}
        </div>
      </main>

      {toast && <div className="toast"><span className="toast-icon"><Command size={14} /></span>{toast}</div>}
    </div>
  )
}

export default App
