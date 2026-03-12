import morandiColors from '../../constants/morandi-colors.json'
import { ALL_LUCIDE_ICONS, LUCIDE_ICON_GROUPS } from '../../constants/lucide-icons'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || ''

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'OPENAI_API_KEY 未設定' })
  }

  const { name, usedIcons = [], excludeIcon = '', excludeColors = [], excludeIcons = [], mode = 'single' } = await readBody(event)
  if (!name?.trim()) {
    throw createError({ statusCode: 400, message: '缺少類別名稱' })
  }

  // ── 顏色池（排除已使用）──────────────────────────────────────────────────────
  const excluded = new Set((excludeColors as string[]).map(c => c.toUpperCase()))
  const availableColors = morandiColors.filter(c => !excluded.has(c.hex.toUpperCase()))
  const colorPool = availableColors.length > 0 ? availableColors : morandiColors
  const colorListStr = colorPool.map(c => `${c.name} ${c.hex}`).join(', ')

  // ── Icon 池 ───────────────────────────────────────────────────────────────────
  const BUILTIN_ICONS = ['Utensils', 'Coffee', 'Home', 'Bus', 'Wifi']
  const allUsedIcons = [...new Set([...BUILTIN_ICONS, ...(usedIcons as string[])])]
  const allExcludeIcons = [...new Set([...allUsedIcons, ...(excludeIcons as string[])])]
  const usedIconsStr = `\n注意：以下 icon 已被現有類別使用，請勿選擇：${allUsedIcons.join('、')}`
  const excludeStr = excludeIcon ? `\n特別注意：請勿選擇「${excludeIcon}」，選擇其他最適合的 icon。` : ''
  const iconList = ALL_LUCIDE_ICONS.join(', ')

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

  if (mode === 'pick') {
    // 根據類別名稱選出最相關群組，回傳群組 icon 清單（至少 12 個）
    const groupsJson = JSON.stringify(LUCIDE_ICON_GROUPS)
    const excludeIconsStr = allExcludeIcons.length > 0
      ? `\n排除已使用的 icon，不要出現在結果中：${allExcludeIcons.join('、')}`
      : ''
    promptContent = `使用者的記帳類別名稱：「${name}」

以下是 icon 群組（群組名稱 → icon 陣列）：
${groupsJson}

請判斷「${name}」最適合哪 1-2 個群組，從最相關的群組取出 icon 排在最前面，若不足 12 個則從第二相關群組補足，最終回傳至少 12 個 icon（若有更多也可回傳）。${excludeIconsStr}

只回傳 JSON，不要其他文字：
{"groups": ["最相關群組名", "次相關群組名"], "icons": ["Icon1", "Icon2", ...]}`
    maxTokens = 300
  }
  else if (mode === 'multiple') {
    promptContent = `使用者新增了一個記帳類別：「${name}」

${RULES}

請從以下 Lucide icon 中，推薦 6 個最適合「${name}」的 icon，從最相關到較相關排序：
${iconList}${usedIconsStr}

只回傳 JSON，不要其他文字：
{"icons": ["Icon1", "Icon2", "Icon3", "Icon4", "Icon5", "Icon6"]}`
    maxTokens = 120
  }
  else {
    promptContent = `使用者新增了一個記帳類別：「${name}」

${RULES}

請從以下 Lucide icon 名稱中選出最適合的一個：
${iconList}${usedIconsStr}${excludeStr}

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

  // Whitelist — only return names that exist in ALL_LUCIDE_ICONS to prevent
  // AI from returning group names (e.g. "社交類") instead of icon names.
  const VALID_ICONS = new Set(ALL_LUCIDE_ICONS)
  const filterIcons = (arr: unknown[]): string[] =>
    arr.filter((n): n is string => typeof n === 'string' && VALID_ICONS.has(n))

  if (mode === 'pick') {
    const groups = Array.isArray(parsed.groups) ? parsed.groups : []
    const raw = Array.isArray(parsed.icons) ? parsed.icons : []
    const icons = filterIcons(raw).length > 0
      ? filterIcons(raw)
      : ['ShoppingBag', 'Heart', 'Gift', 'Briefcase', 'Scissors', 'Camera', 'Music', 'Book', 'Plane', 'Dumbbell', 'PawPrint', 'GraduationCap']
    return { groups, icons }
  }

  if (mode === 'multiple') {
    const raw = Array.isArray(parsed.icons) ? parsed.icons : []
    const icons = filterIcons(raw).slice(0, 6)
    return { icons: icons.length > 0 ? icons : ['ShoppingBag', 'Heart', 'Gift', 'Star', 'Briefcase', 'Scissors'] }
  }

  const icon = typeof parsed.icon === 'string' && VALID_ICONS.has(parsed.icon)
    ? parsed.icon
    : 'ShoppingBag'
  return {
    icon,
    color: parsed.color ?? '#C4B49A',
  }
})
