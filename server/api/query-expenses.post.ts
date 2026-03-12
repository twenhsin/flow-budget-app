import { serverSupabaseClient } from '#supabase/server'
import { CATEGORY_NAMES } from '../../constants/categories'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || ''

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'OPENAI_API_KEY 未設定' })
  }

  const { question, guestExpenses, userCategories } = await readBody(event)
  if (!question?.trim()) {
    throw createError({ statusCode: 400, message: '缺少查詢問題' })
  }

  const isGuest = Array.isArray(guestExpenses)
  const userCatNames: string[] = Array.isArray(userCategories) ? userCategories : []

  const todayDate = new Date()
  const today = todayDate.toISOString().slice(0, 10)

  // 預計算常用相對日期，直接注入 prompt 避免 AI 自行計算出錯
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const yesterday = new Date(todayDate)
  yesterday.setDate(yesterday.getDate() - 1)

  // 本週一（週日 offset = -6，其他 = -(weekday-1)）
  const dow = todayDate.getDay()
  const thisWeekMonday = new Date(todayDate)
  thisWeekMonday.setDate(thisWeekMonday.getDate() - (dow === 0 ? 6 : dow - 1))

  // 上週一 & 上週日
  const lastWeekMonday = new Date(thisWeekMonday)
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 7)
  const lastWeekSunday = new Date(lastWeekMonday)
  lastWeekSunday.setDate(lastWeekSunday.getDate() + 6)

  // 本月第一天 & 上月第一天/最後一天
  const thisMonthFirst = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  const lastMonthFirst = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1)
  const lastMonthLast = new Date(todayDate.getFullYear(), todayDate.getMonth(), 0)

  const dateHints = `
相對日期對照表（基於今天 ${today}）：
- 今天：dateFrom=${today}, dateTo=${today}
- 昨天：dateFrom=${fmtDate(yesterday)}, dateTo=${fmtDate(yesterday)}
- 本週：dateFrom=${fmtDate(thisWeekMonday)}, dateTo=${today}
- 上週：dateFrom=${fmtDate(lastWeekMonday)}, dateTo=${fmtDate(lastWeekSunday)}
- 本月：dateFrom=${fmtDate(thisMonthFirst)}, dateTo=${today}
- 上個月：dateFrom=${fmtDate(lastMonthFirst)}, dateTo=${fmtDate(lastMonthLast)}
- 今年：dateFrom=${todayDate.getFullYear()}-01-01, dateTo=${today}
- 近7天：dateFrom=${fmtDate((() => { const d = new Date(todayDate); d.setDate(d.getDate() - 6); return d })())}, dateTo=${today}
- 近30天：dateFrom=${fmtDate((() => { const d = new Date(todayDate); d.setDate(d.getDate() - 29); return d })())}, dateTo=${today}
- 近三個月：dateFrom=${fmtDate((() => { const d = new Date(todayDate); d.setMonth(d.getMonth() - 3); return d })())}, dateTo=${today}
請嚴格依此對照表設定日期，不要自行推算。`

  const userCatLine = userCatNames.length > 0
    ? `\n- 用戶自訂類別（優先比對）：${userCatNames.join('、')}`
    : ''

  // Step 1 — GPT-4o 解析問題
  const gptBody = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `你是一個記帳 app 的查詢解析器。
今天日期：${today}
使用者問題：${question}
${dateHints}

請解析成以下 JSON 格式，只回傳 JSON，不要有其他文字：
{
  "dateFrom": "YYYY-MM-DD",
  "dateTo": "YYYY-MM-DD",
  "queries": [
    { "type": "category", "value": "類別名稱" },
    { "type": "nameKeyword", "value": "品項關鍵字" }
  ],
  "queryType": "total | list | ranking | monthly | grouped",
  "title": "精確的繁體中文結果頁標題"
}

日期規則：
- 嚴格依照上方對照表，「今天」只查今天、「昨天」只查昨天，不要 fallback 到本月
- dateFrom 和 dateTo 都是含頭含尾的日期（YYYY-MM-DD）

queries 規則：
- 用戶提到的每個關鍵字都必須各自列為一個獨立的 query 項目，不可省略任何一個
- type "category"：關鍵字對應到已知類別（以下預設類別或自訂類別）時使用
  預設類別：${CATEGORY_NAMES.join('、')}${userCatLine}
  自訂類別優先比對，相符則使用完整自訂類別名稱
- type "nameKeyword"：關鍵字是品項名稱（如咖啡、便當、按摩）時使用
- 即使關鍵字之間沒有任何標點符號，也必須嘗試將輸入拆解為多個關鍵字，不可只取第一個
  例如「3c學習按摩」→ [{ type:"nameKeyword", value:"3C" }, { type:"category", value:"學習" }, { type:"nameKeyword", value:"按摩" }]
- 多個關鍵字範例：
  「學習與spa」→ [{ type:"category", value:"學習" }, { type:"category", value:"spa" }]
  「按摩和咖啡」→ [{ type:"nameKeyword", value:"按摩" }, { type:"nameKeyword", value:"咖啡" }]
  「spa和餐飲」→ [{ type:"category", value:"spa" }, { type:"category", value:"餐飲" }]
  「3c學習按摩」→ [{ type:"nameKeyword", value:"3C" }, { type:"category", value:"學習" }, { type:"nameKeyword", value:"按摩" }]
- 沒有特定關鍵字（查全部）時設為 []

title 規則：
- 回傳 HTML 格式：時間詞（純文字）+ 各關鍵字（用 <span class="title-keyword"> 包裹）+ 消費（純文字）
- 格式範例：「本月 <span class="title-keyword">學習</span> <span class="title-keyword">spa</span> 消費」
- 若只有一個關鍵字：「今天 <span class="title-keyword">學習</span> 消費」
- 無關鍵字（查全部）：「本月消費」（不加 span，時間詞直接加「消費」）
- 時間詞必須直接使用用戶原始輸入的詞，不可替換（「今天」→「今天」，「這週」→「這週」）
- 關鍵字必須直接使用用戶原始輸入，不可替換成同義詞或預設類別名稱

queryType 規則：
- total：問總金額、花多少
- list：問明細、有哪些
- ranking：問最高、排行、哪個類別最多
- monthly：問逐月、每個月、各月比較
- grouped：queries 有多項時優先使用，每個 query 各自成一組`,
      },
    ],
    max_tokens: 400,
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

  const { dateFrom, queryType, title } = parsed
  // dateTo 加一天，確保當天資料包含在內（.lt 是嚴格小於）
  const dateToExclusive = new Date(parsed.dateTo)
  dateToExclusive.setDate(dateToExclusive.getDate() + 1)
  const dateTo = dateToExclusive.toISOString().slice(0, 10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryItems: { type: string; value: string }[] = Array.isArray(parsed.queries) ? parsed.queries : []
  const effectiveQueryType = queryItems.length > 1 ? 'grouped' : queryType

  console.log('[query-expenses] GPT parsed:', JSON.stringify({ dateFrom, dateTo, queryItems, queryType: effectiveQueryType, title }))

  // Step 2 — 查詢資料
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let groups: { label: string; total: number; items: any[] }[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sumAmount = (arr: any[]) => arr.reduce((s: number, r: { amount: number }) => s + r.amount, 0)

  if (isGuest) {
    if (queryItems.length > 0) {
      // 每個 query 獨立過濾
      for (const q of queryItems) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qItems = (guestExpenses as any[]).filter((r: any) => {
          const d = r.created_at.slice(0, 10)
          if (d < dateFrom || d >= dateTo) return false
          if (q.type === 'category') return r.category === q.value
          if (q.type === 'nameKeyword') return r.name.toLowerCase().includes(q.value.toLowerCase())
          return false
        })
        groups.push({ label: q.value, total: sumAmount(qItems), items: qItems })
      }
      // 去重合並成 items（供 total/list/ranking/monthly 模式使用）
      const seen = new Set<string>()
      items = groups.flatMap(g => g.items).filter((r: { id: string }) => {
        if (seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
    }
    else {
      // 無關鍵字：取日期範圍內全部
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items = (guestExpenses as any[]).filter((r: { created_at: string }) => {
        const d = r.created_at.slice(0, 10)
        return d >= dateFrom && d < dateTo
      })
    }
  }
  else {
    const client = await serverSupabaseClient(event)
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    if (queryItems.length > 0) {
      // 每個 query 各跑一次 Supabase
      for (const q of queryItems) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let qQuery = (client as any)
          .from('expenses')
          .select('id, name, amount, category, created_at')
          .eq('user_id', user.id)
          .gte('created_at', dateFrom)
          .lt('created_at', dateTo)

        if (q.type === 'category') {
          qQuery = qQuery.eq('category', q.value)
        }
        else if (q.type === 'nameKeyword') {
          qQuery = qQuery.ilike('name', `%${q.value}%`)
        }

        const { data: qData, error: qError } = await qQuery.order('created_at', { ascending: false })
        if (qError) console.error(`[query-expenses] 查詢 "${q.value}" 失敗:`, qError)
        const qItems = qData ?? []
        groups.push({ label: q.value, total: sumAmount(qItems), items: qItems })
      }
      // 去重合並成 items
      const seen = new Set<string>()
      items = groups.flatMap(g => g.items).filter((r: { id: string }) => {
        if (seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
    }
    else {
      // 無關鍵字：取日期範圍內全部
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (client as any)
        .from('expenses')
        .select('id, name, amount, category, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dateFrom)
        .lt('created_at', dateTo)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[query-expenses] Supabase 查詢失敗:', error)
        throw createError({ statusCode: 500, message: error.message })
      }
      items = data ?? []
    }
  }

  const total: number = sumAmount(items)

  // Step 3 — 回傳結果
  console.log('[query-expenses] 回傳 response:', JSON.stringify({
    effectiveQueryType,
    total,
    itemsCount: items.length,
    groupsCount: groups.length,
    groups: groups.map(g => ({ label: g.label, total: g.total, itemsCount: g.items.length })),
  }))
  return {
    title,
    queryType: effectiveQueryType,
    total,
    items,
    groups,
    dateFrom,
    dateTo,
  }
})
