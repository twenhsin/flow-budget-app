export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || ''

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'OPENAI_API_KEY 未設定' })
  }

  const { name, usedIcons = [], excludeIcon = '', excludeColors = [], mode = 'single' } = await readBody(event)
  if (!name?.trim()) {
    throw createError({ statusCode: 400, message: '缺少類別名稱' })
  }

  // 內建類別對應的 Lucide icon（避免重複）
  const BUILTIN_ICONS = ['Utensils', 'Coffee', 'Home', 'Bus', 'Wifi']
  const allUsedIcons = [...new Set([...BUILTIN_ICONS, ...(usedIcons as string[])])]
  const usedIconsStr = `\n注意：以下 icon 已被現有類別使用，請勿選擇：${allUsedIcons.join('、')}`
  const excludeStr = excludeIcon ? `\n特別注意：請勿選擇「${excludeIcon}」，選擇其他最適合的 icon。` : ''

  const ALL_COLORS = ['#C9A69A', '#8FA3B1', '#9CAF96', '#C4B49A', '#B5A8C0', '#D4B8A0', '#A3B5A6', '#B8A5A5']
  const availableColors = ALL_COLORS.filter(c => !(excludeColors as string[]).includes(c))
  const colorList = availableColors.length > 0 ? availableColors : ALL_COLORS
  const colorNames: Record<string, string> = {
    '#C9A69A': '霧玫瑰', '#8FA3B1': '灰藍', '#9CAF96': '鼠尾草綠',
    '#C4B49A': '燕麥', '#B5A8C0': '藕紫', '#D4B8A0': '霧杏',
    '#A3B5A6': '灰綠', '#B8A5A5': '玫瑰灰',
  }
  const colorListStr = colorList.map(c => `${colorNames[c]} ${c}`).join(', ')

  const ICON_LIST = `ShoppingBag（購物袋）, ShoppingBasket（生活雜貨日用品）, Coffee（咖啡飲料）, Car（開車交通）,
Home（居家）, Heart（健康醫療）, Gamepad2（遊戲娛樂）,
Plane（旅遊出行）, Book（書籍學習）, Music（音樂）,
Utensils（餐飲吃飯）, Shirt（服飾穿著）, Dumbbell（運動健身）,
Wifi（網路訂閱）, Gift（禮物）, PawPrint（寵物）,
Scissors（美容美髮）, Baby（嬰幼兒）, Briefcase（工作商務）,
Camera（攝影）, Bus（大眾運輸）, Trees（戶外自然）,
Stethoscope（醫療診所）, GraduationCap（教育學費）, Pizza（外送速食）,
Sparkles（保養品美妝護膚）`

  const RULES = `選擇規則：
- 「旅遊」→ Plane，「健身」→ Dumbbell，「咖啡」→ Coffee
- 「醫療」「診所」「藥局」→ Stethoscope
- 「教育」「學費」「書」→ GraduationCap
- 「生活用品」「日用品」「雜貨」→ ShoppingBasket
- 「保養品」「美妝」「護膚」「彩妝」→ Sparkles
- 「衣服」「服飾」「穿搭」→ Shirt
- 「美容」「美髮」「剪髮」→ Scissors
- 「寵物」「貓」「狗」→ PawPrint
- 「訂閱」「軟體」「APP」→ Wifi`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let promptContent: string
  let maxTokens: number

  if (mode === 'multiple') {
    promptContent = `使用者新增了一個記帳類別：「${name}」

${RULES}

請從以下 Lucide icon 中，推薦 6 個最適合「${name}」的 icon，從最相關到較相關排序：
${ICON_LIST}${usedIconsStr}

只回傳 JSON，不要其他文字：
{"icons": ["Icon1", "Icon2", "Icon3", "Icon4", "Icon5", "Icon6"]}`
    maxTokens = 120
  }
  else {
    promptContent = `使用者新增了一個記帳類別：「${name}」

${RULES}

請從以下 Lucide icon 名稱中選出最適合的一個：
${ICON_LIST}${usedIconsStr}${excludeStr}

請從以下色票中選出最適合的一個（排除已被使用的顏色）：
${colorListStr}

只回傳 JSON，不要其他文字：
{"icon": "Coffee", "color": "#C4B49A"}`
    maxTokens = 60
  }

  const gptBody = {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: promptContent }],
    max_tokens: maxTokens,
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
    console.error('[suggest-category] GPT fetch 失敗:', err)
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

  if (mode === 'multiple') {
    const icons = Array.isArray(parsed.icons) ? parsed.icons.slice(0, 6) : ['ShoppingBag', 'Heart', 'Gift', 'Star', 'Briefcase', 'Scissors']
    return { icons }
  }

  return {
    icon: parsed.icon ?? 'ShoppingBag',
    color: parsed.color ?? '#C4B49A',
  }
})
