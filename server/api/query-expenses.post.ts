import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { CATEGORY_NAMES } from '../../constants/categories'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || ''

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'OPENAI_API_KEY 未設定' })
  }

  const { question } = await readBody(event)
  if (!question?.trim()) {
    throw createError({ statusCode: 400, message: '缺少查詢問題' })
  }

  const today = new Date().toISOString().slice(0, 10)

  // Step 1 — GPT-4o 解析問題
  const gptBody = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `你是一個記帳 app 的查詢解析器。
今天日期：${today}
使用者問題：${question}

請解析成以下 JSON 格式，只回傳 JSON，不要有其他文字：
{
  "dateFrom": "YYYY-MM-DD",
  "dateTo": "YYYY-MM-DD",
  "category": "類別名稱或null",
  "nameKeywords": ["品項1", "品項2"] 或 [],
  "queryType": "total 或 list 或 ranking 或 monthly",
  "title": "精確的繁體中文結果頁標題"
}

category 規則：
- category 只能是以下固定類別之一：${CATEGORY_NAMES.join('、')}
- 如果使用者問的是品項名稱（例如咖啡、便當、計程車、珍奶），category 設為 null，改用 nameKeywords 陣列回傳所有關鍵字
- 如果使用者明確說某個類別（例如餐飲、交通），才填入 category，nameKeywords 設為 []

nameKeywords 規則：
- 若使用者提到多個品項（例如「咖啡和便當」），全部放入陣列：["咖啡", "便當"]
- 若無品項關鍵字，設為空陣列 []

title 規則：
- 必須精確反映查詢的時間範圍與項目，不要用預設範例
- 時間描述用自然語言：這個月、上個月、今年、近三個月（不要用日期數字）
- 範例：「這個月咖啡支出」、「上個月餐飲明細」、「今年各類別排行」、「近三個月咖啡與便當消費」

queryType 規則：
- total：問總金額、花多少
- list：問明細、有哪些
- ranking：問最高、排行、哪個類別最多
- monthly：問逐月、每個月、各月比較
- grouped：問各自、分別、每個品項各花多少（nameKeywords 有多個值時優先考慮）`,
      },
    ],
    max_tokens: 300,
  }

  let gptResponse: Response
  try {
    gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(gptBody),
    })
  }
  catch (err) {
    console.error('[query-expenses] GPT fetch 失敗:', err)
    throw createError({ statusCode: 502, message: 'GPT 請求失敗' })
  }

  const gptRaw = await gptResponse.text()
  if (!gptResponse.ok) {
    console.error('[query-expenses] GPT 錯誤:', gptResponse.status, gptRaw)
    throw createError({ statusCode: 502, message: `GPT ${gptResponse.status}` })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gptData: any
  try {
    gptData = JSON.parse(gptRaw)
  }
  catch {
    throw createError({ statusCode: 502, message: 'GPT 回應非 JSON' })
  }

  const content: string = gptData.choices?.[0]?.message?.content ?? ''
  const stripped = content.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  try {
    parsed = JSON.parse(stripped)
  }
  catch {
    const match = stripped.match(/\{[\s\S]*\}/)
    if (!match) throw createError({ statusCode: 502, message: '無法解析 GPT 回應' })
    try { parsed = JSON.parse(match[0]) }
    catch { throw createError({ statusCode: 502, message: '無法解析 GPT JSON' }) }
  }

  const { dateFrom, category, nameKeywords, queryType, title } = parsed
  const keywords: string[] = Array.isArray(nameKeywords) ? nameKeywords : []
  // dateTo 加一天，確保當天資料包含在內（.lt 是嚴格小於）
  const dateToExclusive = new Date(parsed.dateTo)
  dateToExclusive.setDate(dateToExclusive.getDate() + 1)
  const dateTo = dateToExclusive.toISOString().slice(0, 10)

  console.log('[query-expenses] GPT parsed:', JSON.stringify({ dateFrom, dateTo, category, nameKeywords: keywords, queryType, title }))

  // Step 2 — 查詢 Supabase
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const client = await serverSupabaseClient(event)

  // Debug: 印出資料庫前5筆的 created_at 原始值
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sample } = await (client as any)
    .from('expenses')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  console.log('[query-expenses] 資料庫前5筆 created_at:', sample?.map((r: { name: string; created_at: string }) => ({ name: r.name, created_at: r.created_at })))

  console.log('[query-expenses] 日期過濾條件: .gte("created_at", "' + dateFrom + '") .lt("created_at", "' + dateTo + '")')
  console.log('[query-expenses] 其他條件:', { category: category ?? '(不過濾)', nameKeywords: keywords.length ? keywords : '(不過濾)' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (client as any)
    .from('expenses')
    .select('id, name, amount, category, created_at')
    .eq('user_id', user.id)
    .gte('created_at', dateFrom)
    .lt('created_at', dateTo)

  if (category) {
    query = query.eq('category', category)
  }

  if (keywords.length > 0) {
    const orFilter = keywords.map(k => `name.ilike.%${k}%`).join(',')
    query = query.or(orFilter)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  console.log('[query-expenses] 查詢結果筆數:', data?.length ?? 0)
  if (data?.length) {
    const cats = [...new Set(data.map((r: { category: string }) => r.category))]
    console.log('[query-expenses] 結果中的 category 值:', cats)
  }

  if (error) {
    console.error('[query-expenses] Supabase 查詢失敗:', error)
    throw createError({ statusCode: 500, message: error.message })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = data ?? []
  const total: number = items.reduce((s: number, r: { amount: number }) => s + r.amount, 0)

  // grouped：依 nameKeywords 分組
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let groups: { label: string; total: number; items: any[] }[] = []
  if (queryType === 'grouped' && keywords.length > 0) {
    groups = keywords.map((k) => {
      const groupItems = items.filter((r: { name: string }) =>
        r.name.toLowerCase().includes(k.toLowerCase()),
      )
      return {
        label: k,
        total: groupItems.reduce((s: number, r: { amount: number }) => s + r.amount, 0),
        items: groupItems,
      }
    })
  }

  // Step 3 — 回傳結果
  console.log('[query-expenses] 回傳 response:', JSON.stringify({
    queryType,
    total,
    groupsCount: groups.length,
    groups: groups.map(g => ({ label: g.label, total: g.total, itemsCount: g.items.length })),
  }))
  return {
    title,
    queryType,
    total,
    items,
    groups,
    dateFrom,
    dateTo,
  }
})
