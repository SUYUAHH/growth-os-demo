export const platformRules = {
  X: [
    { id: 'x-hook', name: '文字钩子', description: '首句要有明确判断、冲突或问题。', check: (text) => /你|如何|为什么|不要|最容易|how|why|you/i.test(text.slice(0, 90)), suggestion: '把具体判断或用户问题放到前 90 个字符。' },
    { id: 'x-length', name: '阅读长度', description: '正文保持短段落，适合信息流快速阅读。', check: (text) => text.length >= 40 && text.length <= 280, suggestion: '控制在 40–280 字符，删掉背景铺垫。' },
    { id: 'x-conversation', name: '评论引导', description: '结尾应留下可回答的问题。', check: (text) => /评论|告诉我|你呢|分享|reply|comment|agree/i.test(text), suggestion: '用一个具体问题收尾，邀请用户分享经验。' },
  ],
  TikTok: [
    { id: 'tiktok-hook', name: '前 3 秒钩子', description: '开头直接呈现结果、冲突或动作。', check: (text) => /先看|结果|只需|不要|3秒|first|before|after/i.test(text.slice(0, 90)), suggestion: '前 3 秒先给结果或动作，减少片头自我介绍。' },
    { id: 'tiktok-visual', name: '画面节奏', description: '短视频需要明确的动作和画面变化。', check: (_text, input) => Boolean(input.hasMedia), suggestion: '补充竖屏视频、动作镜头和字幕节奏。' },
    { id: 'tiktok-caption', name: '字幕可读性', description: '关键信息要能脱离声音被理解。', check: (text) => text.length >= 20, suggestion: '把关键步骤拆成短字幕，避免整段文字堆叠。' },
  ],
  Instagram: [
    { id: 'instagram-cover', name: '封面与首图', description: '首图需要清晰主体和统一视觉。', check: (_text, input) => Boolean(input.hasMedia), suggestion: '准备 4:5 首图，突出主体并保持账号视觉统一。' },
    { id: 'instagram-save', name: '保存价值', description: '内容应提供可收藏的步骤、清单或路线。', check: (text) => /步骤|清单|路线|收藏|save|checklist|steps/i.test(text), suggestion: '补充清单、步骤或路线，让用户有保存理由。' },
    { id: 'instagram-caption', name: 'Caption 结构', description: '正文需要分段并保留互动结尾。', check: (text) => text.length >= 60 && /评论|分享|你呢|comment|share/i.test(text), suggestion: '分段补充背景和细节，并在结尾加入互动问题。' },
  ],
  '小红书': [
    { id: 'xiaohongshu-title', name: '标题搜索词', description: '标题要包含用户会主动搜索的场景词和结果词。', check: (text) => text.length >= 12 && /清单|攻略|教程|步骤|测评|通勤|早餐|旅行|方法|避坑/i.test(text), suggestion: '加入具体场景词、目标人群和结果词，避免只有情绪表达。' },
    { id: 'xiaohongshu-cover', name: '封面信息', description: '封面需要一眼看懂主题，并保持真实、清晰和统一。', check: (_text, input) => Boolean(input.hasMedia), suggestion: '准备 3:4 或 4:3 封面，突出一个主体，不堆叠过多信息。' },
    { id: 'xiaohongshu-save', name: '收藏价值', description: '内容应提供清单、步骤、攻略或可复用经验。', check: (text) => /清单|攻略|教程|步骤|收藏|避坑|checklist|steps/i.test(text), suggestion: '补充可执行清单或步骤，让用户有收藏和回看的理由。' },
    { id: 'xiaohongshu-note', name: '笔记真实感', description: '表达应像真实经验分享，避免夸张承诺和硬广口吻。', check: (text) => !/百分之百|绝对|稳赚|最好|全网第一|100%/.test(text), suggestion: '删除绝对化和广告化表达，补充个人体验、限制条件或适用人群。' },
  ],
}

export const commonPlatformRules = [
  { id: 'common-original', name: '原创与版权', description: '素材必须确认来源、授权和二次创作边界。' },
  { id: 'common-risk', name: '合规风险', description: '避免绝对化承诺、虚假效果和误导性表达。' },
  { id: 'common-human', name: '人工确认', description: '规则只提供依据，最终发布由运营人员确认。' },
]

export const complianceRules = [
  { id: 'disclosure', name: '广告 / Affiliate 披露', riskLevel: '高', check: (input) => !input.hasAffiliate || Boolean(input.hasDisclosure), suggestion: '如存在赞助或联盟链接，明确标注 Sponsored / Affiliate。' },
  { id: 'claims', name: '健康 / 金融效果声明', riskLevel: '高', check: (input) => !/(保证|稳赚|百分之百|绝对|guarantee|guaranteed|risk[- ]?free|100%)/i.test(input.text || ''), suggestion: '删除绝对化承诺，增加适用条件和风险提示。' },
  { id: 'privacy', name: '隐私与个人信息', riskLevel: '高', check: (input) => !/(手机号|电话号码|phone number|email me|住址|address)/i.test(input.text || ''), suggestion: '不要公开收集用户敏感信息，改为平台内合规沟通。' },
  { id: 'media-rights', name: '素材与肖像权', riskLevel: '高', check: (input) => !input.hasMedia || Boolean(input.hasMediaRights), suggestion: '确认图片人物肖像权、音乐版权和品牌商标使用边界。' },
  { id: 'ai-label', name: 'AI 生成内容标识', riskLevel: '中', check: (input) => !input.aiGenerated || Boolean(input.aiDisclosure), suggestion: '如使用 AI 生成主体或场景，按平台要求增加必要标识。' },
]

export function evaluateComplianceRules(input = {}) {
  const checks = complianceRules.map((rule) => ({ id: rule.id, name: rule.name, riskLevel: rule.riskLevel, status: rule.check(input) ? '通过' : '人工确认', detail: rule.check(input) ? '当前未发现明显风险。' : rule.suggestion }))
  return { checks, status: checks.some((item) => item.status === '人工确认') ? '人工确认' : '通过' }
}

export const platformBriefs = {
  X: { goal: '讨论、转发、观点扩散', contentTypes: ['短文本', '线程', '观点评论'], riskLevel: '中' },
  TikTok: { goal: '前几秒留存、完播、重复播放', contentTypes: ['短视频', '教程', '情境演绎'], riskLevel: '高' },
  Instagram: { goal: '保存、分享、视觉一致性', contentTypes: ['图文', 'Carousel', 'Reels'], riskLevel: '中' },
  '小红书': { goal: '搜索、收藏、评论与经验可信度', contentTypes: ['攻略', '清单', '教程', '测评'], riskLevel: '高' },
}

export function getPlatformBrief(channel = 'X') {
  return platformBriefs[channel] || platformBriefs.X
}

export function evaluatePlatformRules(channel = 'X', input = {}) {
  const text = String(input.text || '').trim()
  const rules = platformRules[channel] || platformRules.X
  const checks = rules.map((rule) => ({ id: rule.id, name: rule.name, status: rule.check(text, input) ? '通过' : '建议修改', detail: rule.check(text, input) ? rule.description : rule.suggestion }))
  const brief = getPlatformBrief(channel)
  return { channel, brief, checks: checks.map((item) => ({ ...item, manualReview: item.status !== '通过' || channel === '小红书' })), passed: checks.filter((item) => item.status === '通过').length, total: checks.length, status: checks.every((item) => item.status === '通过') ? '通过' : '建议修改' }
}
