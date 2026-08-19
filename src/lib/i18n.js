export const navLabels = {
  original: {
    dashboard: { label: 'Overview', description: 'Portfolio · Risk · Alerts' },
    intelligence: { label: 'Growth Intelligence', description: 'Signals · Review · Benchmarks' },
    remix: { label: 'Viral Remix', description: 'Structure · Concepts · Draft' },
    distribution: { label: 'Distribution', description: 'Publish · Health · Review' },
  },
  zh: {
    dashboard: { label: '总仪表盘', description: '全局 · 账号 · 预警' },
    intelligence: { label: '增长情报', description: '热点 · 复盘 · 对标' },
    remix: { label: '爆款拆解', description: '结构 · 选题 · 二创' },
    distribution: { label: '分发优化', description: '发布 · 健康 · 复盘' },
  },
}

export const interfaceCopy = {
  original: {
    workspace: 'WORKSPACE', operations: 'OPERATIONS', agentReady: '3 Agents ready', synced: 'Data synced 09:42', environment: 'DEMO ENVIRONMENT', language: 'Language', original: 'Original', translated: '中文', monitorOn: 'MONITOR ON', monitorOff: 'MONITOR OFF', operator: 'Operator', toggleLabel: 'Switch interface language', collapsed: 'Collapse sidebar', expanded: 'Expand sidebar', notifications: 'Notifications', openNavigation: 'Open navigation', translationHint: 'Translate interface to Chinese',
  },
  zh: {
    workspace: '工作区', operations: '功能模块', agentReady: '3 个 Agent 已就绪', synced: '数据同步于 09:42', environment: '演示环境', language: '界面语言', original: '原始', translated: '中文', monitorOn: '实时监测', monitorOff: '监测已关闭', operator: '运营人员', toggleLabel: '切换界面语言', collapsed: '收起侧栏', expanded: '展开侧栏', notifications: '通知', openNavigation: '打开导航', translationHint: '一键翻译为中文',
  },
}

export function getInterfaceCopy(language) {
  return interfaceCopy[language === 'zh' ? 'zh' : 'original']
}
