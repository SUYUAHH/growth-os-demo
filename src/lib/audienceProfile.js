const profileByCategory = {
  lifestyle: {
    primarySegment: '北美城市职场人 · 25–34 岁',
    segments: [
      { label: '核心人群', value: '25–34 岁', detail: '工作节奏快，愿意为低成本的生活改善买单' },
      { label: '次级人群', value: '35–44 岁', detail: '关注家庭效率和可持续的日常习惯' },
      { label: '地域倾向', value: '美国西海岸 / 加拿大', detail: '英语内容消费为主，偏好真实体验分享' },
    ],
    interests: ['日常仪式感', '效率与自我管理', '居家生活', '轻量健康'],
    activeWindows: [
      { label: '午休浏览', time: '12:00–14:00', strength: 72 },
      { label: '晚间互动', time: '19:00–22:00', strength: 91 },
      { label: '周末灵感', time: '周六 09:00–11:00', strength: 64 },
    ],
    engagementIntent: '用户更愿意分享自己的做法，并在评论区补充具体生活场景；适合用问题型 CTA 拉动讨论。',
    contentPreferences: ['第一人称真实体验', '一个问题对应一个小动作', '前后对比与可执行清单'],
    avoid: ['空泛的成功学表达', '无法验证的健康承诺', '脱离日常场景的精致摆拍'],
    nextMove: '连续测试 3 条“今天就能试”的微习惯内容，重点观察评论中的自发尝试意图。',
  },
  food: {
    primarySegment: '北美年轻家庭与忙碌上班族 · 24–39 岁',
    segments: [
      { label: '核心人群', value: '24–39 岁', detail: '追求省时、好吃且容易复刻的工作日晚餐' },
      { label: '决策因素', value: '时间 / 成本 / 难度', detail: '会保存食谱，也会追问替代食材和具体步骤' },
      { label: '地域倾向', value: '美国 / 英国 / 澳大利亚', detail: '接受跨文化口味，但需要清楚的份量和材料说明' },
    ],
    interests: ['一锅料理', '高蛋白早餐', '低预算菜单', '替代食材'],
    activeWindows: [
      { label: '下班决策', time: '16:00–19:00', strength: 89 },
      { label: '晚餐后收藏', time: '20:00–22:00', strength: 78 },
      { label: '周日备餐', time: '周日 10:00–13:00', strength: 83 },
    ],
    engagementIntent: '评论往往是高意图问题，例如“能否替换食材”“几人份”“可以提前准备吗”；适合把评论反哺为下一期选题。',
    contentPreferences: ['15 分钟内完成', '分步镜头与材料清单', '替代方案和失败提醒'],
    avoid: ['只展示成品不展示过程', '夸大“零失败”', '忽略过敏原与份量信息'],
    nextMove: '把高频评论按步骤、替代、口味三类沉淀，优先做一条“同一底料三种变化”的系列内容。',
  },
  travel: {
    primarySegment: '北美周末短途旅行者 · 26–40 岁',
    segments: [
      { label: '核心人群', value: '26–40 岁', detail: '工作日忙碌，周末寻找半天到两天的低门槛路线' },
      { label: '出行方式', value: '自驾 / 城市周边', detail: '关注停车、耗时、难度和是否适合新手' },
      { label: '地域倾向', value: '美国西海岸', detail: '偏好实用路线信息，也在意真实天气和拥挤程度' },
    ],
    interests: ['周末路线', '轻徒步', '城市周边', '自然疗愈'],
    activeWindows: [
      { label: '周末计划', time: '周四–周五 18:00–21:00', strength: 86 },
      { label: '出发前收藏', time: '周六 07:00–09:00', strength: 74 },
      { label: '返程分享', time: '周日 17:00–20:00', strength: 68 },
    ],
    engagementIntent: '用户会收藏路线并追问交通、难度和真实耗时；收藏是首要信号，评论问题可以直接转成路线补充内容。',
    contentPreferences: ['路线信息一屏看懂', '真实耗时与避坑', '低门槛系列化路线'],
    avoid: ['只拍风景不交代路径', '把极限体验包装成普通出行', '忽略天气和安全提醒'],
    nextMove: '将“半天重启路线”扩成 4 周栏目，每条固定补充耗时、难度、停车和收藏理由。',
  },
  default: {
    primarySegment: '账号目标用户 · 待接入真实数据',
    segments: [{ label: '当前状态', value: 'Demo 推测画像', detail: '接入平台数据后再校准人群和兴趣分布' }],
    interests: ['待通过内容互动验证'],
    activeWindows: [{ label: '待验证', time: '暂无', strength: 0 }],
    engagementIntent: '当前没有足够的真实互动样本，建议先通过 3 条内容实验收集证据。',
    contentPreferences: ['待验证'],
    avoid: ['将推测当作真实用户数据'],
    nextMove: '先完成小样本发布与数据回流，再更新用户画像。',
  },
}

export function getAudienceProfile(account = {}) {
  const fallback = profileByCategory[account.category] || profileByCategory.default
  return { ...fallback, ...(account.audienceProfile || {}) }
}

