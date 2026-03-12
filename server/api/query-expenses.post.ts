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
  "category": "類別名稱或null",
  "multiCategories": ["類別1", "類別2"] 或 null,
  "nameKeywords": ["品項1", "品項2"] 或 [],
  "queryType": "total 或 list 或 ranking 或 monthly 或 grouped",
  "title": "精確的繁體中文結果頁標題"
}

日期規則：
- 嚴格依照上方對照表，「今天」只查今天、「昨天」只查昨天，不要 fallback 到本月
- dateFrom 和 dateTo 都是含頭含尾的日期（YYYY-MM-DD）

category 規則：
- 預設類別：${CATEGORY_NAMES.join('、')}${userCatLine}
- 查詢關鍵字若與自訂類別名稱相符或相近，優先填入自訂類別的完整名稱，不要對應到預設類別
- category 必須是以上預設類別或自訂類別之一，否則設為 null
- 如果使用者問的是品項名稱（例如咖啡、便當、計程車、珍奶），category 設為 null，改用 nameKeywords 陣列回傳所有關鍵字
- 如果使用者明確說某個類別（例如餐飲、交通），才填入 category，nameKeywords 設為 []

multiCategories 規則：
- 當用戶的關鍵字同時符合「自訂類別名稱」且有語意相近的「預設類別」時，設此欄位
- 例如「spa」是自訂類別、「休閒」是語意相近的預設類別 → multiCategories: ["spa", "休閒"]
- 設定 multiCategories 時：category 設 null、nameKeywords 設 []、queryType 設 "grouped"
- 若無此情況設為 null

nameKeywords 規則：
- 若使用者提到多個品項或關鍵字（例如「咖啡和便當」、「按摩與學習」），全部放入陣列，順序不影響查詢結果
- nameKeywords 的每個元素都是獨立查詢，不受陣列順序影響
- 若無品項關鍵字，設為空陣列 []

title 規則：
- 必須直接使用用戶原始輸入的時間詞和關鍵字，不可替換成同義詞或預設類別名稱
- 若用戶說「今天」，標題用「今天」；說「這週」，標題用「這週」；不要改成「本月」或具體日期
- 例如用戶輸入「今天學習消費」，標題應為「今天學習消費」
- 例如用戶輸入「伙食和學習」，標題應為「這個月伙食和學習支出」，不能改成「餐飲與教育」

queryType 規則：
- total：問總金額、花多少
- list：問明細、有哪些
- ranking：問最高、排行、哪個類別最多
- monthly：問逐月、每個月、各月比較
- grouped：問各自、分別、每個品項各花多少（nameKeywords 有多個值時優先考慮）`,
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

  const { dateFrom, category, nameKeywords, queryType, title, multiCategories } = parsed
  const keywords: string[] = Array.isArray(nameKeywords) ? nameKeywords : []
  const multiCats: string[] = Array.isArray(multiCategories) ? multiCategories : []
  // dateTo 加一天，確保當天資料包含在內（.lt 是嚴格小於）
  const dateToExclusive = new Date(parsed.dateTo)
  dateToExclusive.setDate(dateToExclusive.getDate() + 1)
  const dateTo = dateToExclusive.toISOString().slice(0, 10)

  const effectiveQueryType = multiCats.length > 0 ? 'grouped' : queryType

  console.log('[query-expenses] GPT parsed:', JSON.stringify({ dateFrom, dateTo, category, nameKeywords: keywords, multiCats, queryType: effectiveQueryType, title }))

  // Step 2 — 查詢資料
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let groups: { label: string; total: number; items: any[] }[] = []

  if (isGuest) {
    if (multiCats.length > 0) {
      // 多類別分組：每個類別分別過濾
      for (const cat of multiCats) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const catItems = (guestExpenses as any[]).filter((r: any) => {
          const d = r.created_at.slice(0, 10)
          return d >= dateFrom && d < dateTo && r.category === cat
        })
        groups.push({ label: cat, total: catItems.reduce((s: number, r: { amount: number }) => s + r.amount, 0), items: catItems })
      }
      items = groups.flatMap(g => g.items)
    }
    else {
      // 訪客模式：直接過濾 localStorage 資料
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items = (guestExpenses as any[]).filter((r: { created_at: string; category: string; name: string }) => {
        const d = r.created_at.slice(0, 10)
        if (d < dateFrom || d >= dateTo) return false
        if (category && r.category !== category) return false
        if (keywords.length > 0 && !keywords.some(k => r.name.toLowerCase().includes(k.toLowerCase()))) return false
        return true
      })
    }
  }
  else {
    const client = await serverSupabaseClient(event)
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

    if (multiCats.length > 0) {
      // 多類別分組：每個類別各跑一次 Supabase 查詢
      for (const cat of multiCats) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: catData } = await (client as any)
          .from('expenses')
          .select('id, name, amount, category, created_at')
          .eq('user_id', user.id)
          .eq('category', cat)
          .gte('created_at', dateFrom)
          .lt('created_at', dateTo)
          .order('created_at', { ascending: false })
        const catItems = catData ?? []
        groups.push({ label: cat, total: catItems.reduce((s: number, r: { amount: number }) => s + r.amount, 0), items: catItems })
      }
      items = groups.flatMap(g => g.items)
    }
    else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (client as any)
        .from('expenses')
        .select('id, name, amount, category, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dateFrom)
        .lt('created_at', dateTo)

      if (category) query = query.eq('category', category)

      if (keywords.length > 0) {
        const orFilter = keywords.map(k => `name.ilike.%${k}%`).join(',')
        query = query.or(orFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('[query-expenses] Supabase 查詢失敗:', error)
        throw createError({ statusCode: 500, message: error.message })
      }
      items = data ?? []
    }
  }

  const total: number = items.reduce((s: number, r: { amount: number }) => s + r.amount, 0)

  // 關鍵字分組（僅在非多類別模式下）
  if (effectiveQueryType === 'grouped' && keywords.length > 0 && multiCats.length === 0) {
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
    effectiveQueryType,
    total,
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
