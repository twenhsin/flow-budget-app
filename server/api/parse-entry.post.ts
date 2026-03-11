import { CATEGORY_NAMES } from '../../constants/categories'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || ''

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'OPENAI_API_KEY 未設定' })
  }

  const { text } = await readBody(event)
  console.log('[parse-entry] 收到 text:', text)
  if (!text?.trim()) {
    throw createError({ statusCode: 400, message: '缺少輸入文字' })
  }

  const categoryList = CATEGORY_NAMES.join('、')

  const gptBody = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `你是記帳助手，請從以下輸入解析出品項名稱、金額與類別。

輸入：「${text}」

可選類別：${categoryList}
請根據品項名稱判斷最符合的類別，若無法判斷則填「其他」。

只回傳 JSON，不要其他文字：
{"name": "品項名稱", "amount": 金額數字, "category": "類別名稱"}`,
      },
    ],
    max_tokens: 80,
  }

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(gptBody),
    })
  }
  catch (err) {
    console.error('[parse-entry] GPT fetch 失敗:', err)
    throw createError({ statusCode: 502, message: 'GPT 請求失敗' })
  }

  const raw = await res.text()
  if (!res.ok) {
    throw createError({ statusCode: 502, message: `GPT ${res.status}` })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gptData: any
  try { gptData = JSON.parse(raw) }
  catch { throw createError({ statusCode: 502, message: 'GPT 回應非 JSON' }) }

  const content: string = gptData.choices?.[0]?.message?.content ?? ''
  console.log('[parse-entry] GPT 回傳 content:', content)
  const stripped = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  try { parsed = JSON.parse(stripped) }
  catch {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (!match) throw createError({ statusCode: 502, message: '無法解析 GPT 回應' })
    try { parsed = JSON.parse(match[0]) }
    catch { throw createError({ statusCode: 502, message: '無法解析 GPT JSON' }) }
  }

  const result = {
    name: parsed.name ?? text,
    amount: typeof parsed.amount === 'number' ? parsed.amount : 0,
    category: parsed.category ?? '其他',
  }
  console.log('[parse-entry] 回傳前端:', result)
  return result
})
