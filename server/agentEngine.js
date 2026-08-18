import { breakdown, concepts } from '../src/data/mockData.js'

function localAnalysis(trend) {
  return {
    provider: 'local-rules',
    confidence: 0.86,
    generatedAt: new Date().toISOString(),
    trendId: trend.id,
    breakdown,
    concepts: concepts.map((concept, index) => ({
      ...concept,
      id: `${trend.id}-concept-${index + 1}`,
      angle: index === 0 ? `${trend.chineseTitle}：把抽象趋势翻译成一个真实生活判断` : concept.angle,
    })),
    draft: concepts[0].draft,
  }
}

function parseModelPayload(payload, trend) {
  const text = payload.choices?.[0]?.message?.content || ''
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (!json) throw new Error('Model response did not contain JSON')
  const parsed = JSON.parse(json)
  return { ...parsed, provider: 'model', generatedAt: new Date().toISOString(), trendId: trend.id }
}

async function modelAnalysis(trend) {
  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a content growth analyst. Return valid JSON only with keys breakdown (array of {label,value,detail}), concepts (array of {id,label,title,angle,score,draft}), and draft. Keep content practical and platform-safe.' },
        { role: 'user', content: JSON.stringify({ task: 'Analyze this trend and generate differentiated content for the account.', trend: { title: trend.title, chineseTitle: trend.chineseTitle, audience: trend.audience, gap: trend.gap, sourcePost: trend.sourcePost } }) },
      ],
    }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error?.message || `Model API error ${response.status}`)
  return parseModelPayload(payload, trend)
}

export function agentStatus() {
  return {
    configured: Boolean(process.env.AI_API_KEY),
    provider: process.env.AI_API_KEY ? 'model' : 'local-rules',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    message: process.env.AI_API_KEY ? '已配置模型接口，可执行真实生成。' : '未配置模型接口，当前使用本地规则引擎。',
  }
}

export async function generateRemix(trend, { forceModel = false } = {}) {
  if ((forceModel || process.env.AI_API_KEY) && process.env.AI_API_KEY) {
    try { return await modelAnalysis(trend) } catch (error) {
      if (forceModel) throw error
    }
  }
  return localAnalysis(trend)
}
