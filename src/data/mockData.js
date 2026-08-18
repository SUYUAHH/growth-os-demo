export const account = {
  name: 'Lumen Auto Global',
  handle: '@lumenautoglobal',
  platform: 'TikTok · Instagram',
  avatar: 'LA',
  region: 'North America',
  health: 78,
  healthLabel: '稳步增长',
  followers: '28.4K',
  growth: '+18.6%',
}

export const navItems = [
  { id: 'dashboard', label: '总仪表盘', description: '全局 · 账号 · 预警' },
  { id: 'intelligence', label: '增长情报', description: '热点 · 复盘 · 对标' },
  { id: 'remix', label: '爆款拆解', description: '结构 · 选题 · 二创' },
  { id: 'distribution', label: '分发优化', description: '发布 · 健康 · 复盘' },
]

export const trends = [
  {
    id: 'quiet-luxury',
    title: 'Quiet luxury, but make it practical',
    chineseTitle: '低调豪华，回到真实生活',
    source: 'TikTok Creative Center',
    age: '3h ago',
    momentum: 92,
    relevance: 88,
    competition: '中',
    status: '建议跟进',
    statusTone: 'positive',
    category: 'Lifestyle',
    views: '12.8M',
    audience: '25-34 · 新中产 · 通勤场景',
    whyNow: '近 24 小时相关内容增长 164%，但汽车账号参与率仅 7%。',
    gap: '当前账号有“空间体验”素材，但缺少能把功能翻译成生活方式的表达。',
    action: '用真实通勤场景切入，把“高级感”落到安静、收纳和省心三个可感知细节。',
    tags: ['趋势上升', '低竞争', '账号高匹配'],
    sourcePost: 'POV: you finally understand why quiet luxury is less about labels and more about how your morning feels.',
  },
  {
    id: 'first-car',
    title: 'The first-car decision diary',
    chineseTitle: '年轻人的第一台车，先解决哪件事？',
    source: 'Trend Radar · Community',
    age: '6h ago',
    momentum: 81,
    relevance: 94,
    competition: '高',
    status: '值得测试',
    statusTone: 'warning',
    category: 'Decision',
    views: '8.4M',
    audience: '22-29 · 首购用户 · 城市通勤',
    whyNow: '评论区“预算 / 续航 / 停车”问题密度持续上升，用户正在主动求建议。',
    gap: '竞品都在讲参数，缺少“我今天为什么真的需要它”的具体决策场景。',
    action: '做一条“下班后 30 分钟”的真实决策日记，把复杂参数藏进生活选择里。',
    tags: ['高意图', '评论驱动', '适合系列化'],
    sourcePost: 'I did not buy my first car for the weekend road trips. I bought it for the Tuesday nights I got home late.',
  },
  {
    id: 'tiny-upgrade',
    title: 'One tiny upgrade that changed my commute',
    chineseTitle: '一个小升级，改变一整段通勤',
    source: 'Instagram Reels',
    age: 'Yesterday',
    momentum: 74,
    relevance: 79,
    competition: '低',
    status: '可持续',
    statusTone: 'neutral',
    category: 'Product',
    views: '5.2M',
    audience: '28-38 · 高频通勤 · 功能敏感',
    whyNow: '“small upgrade” 相关保存率比平均值高 31%，适合做功能型内容。',
    gap: '账号内容常用大场景，但没有持续拆出可被收藏的微小功能。',
    action: '围绕一个功能拍摄前后对比，用 15 秒完成“困扰 - 发现 - 轻松”的情绪转折。',
    tags: ['低成本', '高收藏', '可连载'],
    sourcePost: 'The best car features are the ones you stop noticing because they quietly make every day easier.',
  },
]

export const accountSignals = [
  { label: '选题匹配度', value: 86, delta: '+12%', tone: 'positive' },
  { label: 'Hook 前 3 秒留存', value: 64, delta: '-6%', tone: 'negative' },
  { label: '评论意图密度', value: 73, delta: '+18%', tone: 'positive' },
  { label: '发布节奏稳定度', value: 81, delta: '+4%', tone: 'positive' },
]

export const managedAccounts = [
  {
    id: 'lumen-global',
    name: 'Lumen Auto Global',
    handle: '@lumenautoglobal',
    avatar: 'LA',
    platform: 'TikTok · Instagram',
    health: 78,
    grade: 'B+',
    status: '稳步增长',
    issue: 'Hook 前 3 秒留存偏低',
    issueType: '内容表达',
    action: '连续测试 3 条“生活判断”开头，减少参数式开场。',
    signals: accountSignals,
    leaderGuide: ['本周优先修复前 3 秒留存，不扩展新栏目。', '把 quiet luxury 做成 3 条连续实验，统一 CTA。', '周五复盘评论意图密度和收藏率。'],
  },
  {
    id: 'nova-ev',
    name: 'NOVA EV Stories',
    handle: '@novaevstories',
    avatar: 'NE',
    platform: 'TikTok',
    health: 66,
    grade: 'C+',
    status: '需要干预',
    issue: '互动意图没有被承接',
    issueType: '互动机制',
    action: '把高意图评论沉淀为下一期选题，并设置评论回复模板。',
    signals: [
      { label: '选题匹配度', value: 72, delta: '+3%', tone: 'positive' },
      { label: 'Hook 前 3 秒留存', value: 71, delta: '+8%', tone: 'positive' },
      { label: '评论意图密度', value: 48, delta: '-14%', tone: 'negative' },
      { label: '发布节奏稳定度', value: 57, delta: '-9%', tone: 'negative' },
    ],
    leaderGuide: ['先补评论承接，不新增投放预算。', '把“续航焦虑”评论分成问题、比较、购买意向三类。', '下周一看评论转选题率是否超过 20%。'],
  },
  {
    id: 'atlas-drive',
    name: 'Atlas Drive Club',
    handle: '@atlasdriveclub',
    avatar: 'AD',
    platform: 'Instagram Reels',
    health: 84,
    grade: 'A-',
    status: '可放大',
    issue: '内容表现好，但缺少系列化',
    issueType: '发布节奏',
    action: '把高收藏的通勤功能拆成固定栏目，形成可预期的发布节奏。',
    signals: [
      { label: '选题匹配度', value: 91, delta: '+16%', tone: 'positive' },
      { label: 'Hook 前 3 秒留存', value: 79, delta: '+11%', tone: 'positive' },
      { label: '评论意图密度', value: 82, delta: '+9%', tone: 'positive' },
      { label: '发布节奏稳定度', value: 61, delta: '-4%', tone: 'negative' },
    ],
    leaderGuide: ['把“一个小升级”扩成 4 周连续栏目。', '维持生活化表达，不要因为数据好转向参数堆叠。', '给每条内容增加明确的收藏理由。'],
  },
]

export const benchmarks = [
  { rank: '01', name: 'Drive with Maya', handle: '@drivewithmaya', followers: '412K', hook: 'A car feature I did not expect to love', rate: '8.6%', color: '#d6e6ff' },
  { rank: '02', name: 'Everyday Motion', handle: '@everydaymotion', followers: '186K', hook: 'The 30-minute commute test', rate: '6.9%', color: '#f6d7c7' },
  { rank: '03', name: 'Lumen Auto Global', handle: '@lumenautoglobal', followers: '28.4K', hook: 'What makes a car feel calm?', rate: '4.8%', color: '#d7e7d7' },
]

export const breakdown = [
  { label: 'Hook', value: '反常识的个人判断', detail: '先讲“我为什么买它”，再揭示产品原因。' },
  { label: 'Structure', value: '困扰 → 细节 → 情绪转折', detail: '每 4-5 秒出现一个可验证的生活细节。' },
  { label: 'Emotion', value: '被理解 / 终于轻松', detail: '不强调炫耀感，把高级感还原成不费力。' },
  { label: 'CTA', value: '邀请用户补充场景', detail: '“你每天最想被车解决的麻烦是什么？”' },
]

export const concepts = [
  {
    id: 'concept-1',
    label: 'Concept 01',
    title: 'A calm car for a loud day',
    angle: '把“安静”从参数变成下班后的情绪价值',
    score: 91,
    draft: 'Some days you do not need a faster car. You need five quiet minutes before you walk through the front door. That is what this cabin gives me: less noise, more room to come back to myself.',
  },
  {
    id: 'concept-2',
    label: 'Concept 02',
    title: 'The Tuesday night test',
    angle: '用高频工作日验证一台车是否真的好用',
    score: 87,
    draft: 'Weekend test drives are easy. Try the car on a Tuesday night instead: groceries in one hand, a low battery, and zero patience. The best features are the ones that make that version of life feel lighter.',
  },
  {
    id: 'concept-3',
    label: 'Concept 03',
    title: 'Luxury is one less thing to think about',
    angle: '把豪华重新定义为“不需要操心”',
    score: 83,
    draft: 'I used to think luxury was a badge. Now I think it is one less thing to think about: the door opens when your hands are full, the cabin stays calm, and the commute does not ask for your attention.',
  },
]

export const distributionRecommendations = [
  { id: 'hook', label: '开头 3 秒', title: '先说“你不需要更快的车”', detail: '与当前账号常用的参数开场错位，预计提升前 3 秒留存。', score: 89, status: '建议采用', tone: 'positive' },
  { id: 'time', label: '发布时间', title: '周四 19:30 - 20:15', detail: '目标用户下班后在线峰值，建议避开周五促销内容竞争。', score: 84, status: '建议发布', tone: 'positive' },
  { id: 'cta', label: '互动引导', title: '把 CTA 改成场景提问', detail: '让评论从“好看”转向“我也有这个困扰”，便于捕捉高意图用户。', score: 76, status: '建议修改', tone: 'warning' },
  { id: 'risk', label: '风险检查', title: '避免“quiet luxury”直接承诺', detail: '不要使用“最安静”“零噪音”等绝对表述，保留人工审核。', score: 92, status: '已通过', tone: 'neutral' },
]

export const activity = [
  { time: '09:42', text: '发现新机会：Quiet luxury, but make it practical', type: 'insight' },
  { time: '09:28', text: '完成账号近 7 日复盘，识别 2 个增长缺口', type: 'review' },
  { time: '昨日', text: '保存 1 条可复用内容原则到资产库', type: 'save' },
]
