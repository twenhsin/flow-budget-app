export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || ''

  if (!apiKey) {
    throw createError({ statusCode: 500, message: 'OPENAI_API_KEY 未設定' })
  }

  const { name } = await readBody(event)
  if (!name?.trim()) {
    throw createError({ statusCode: 400, message: '缺少類別名稱' })
  }

  const gptBody = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `使用者新增了一個記帳類別：「${name}」

請根據類別名稱的語意選擇最符合的 icon，例如「旅遊」選 Plane，「健身」選 Dumbbell，「咖啡」選 Coffee，「醫療」選 Stethoscope，「教育」選 GraduationCap。

請從以下 Lucide icon 名稱中選出最適合的一個：
ShoppingBag（購物）, Coffee（咖啡飲料）, Car（交通開車）,
Home（居家）, Heart（健康醫療）, Gamepad2（遊戲娛樂）,
Plane（旅遊出行）, Book（書籍學習）, Music（音樂）,
Utensils（餐飲吃飯）, Shirt（服飾穿著）, Dumbbell（運動健身）,
Wifi（網路訂閱）, Gift（禮物）, PawPrint（寵物）,
Scissors（美容美髮）, Baby（嬰幼兒）, Briefcase（工作商務）,
Camera（攝影）, Bus（大眾運輸）, Trees（戶外自然）,
Stethoscope（醫療）, GraduationCap（教育）, Pizza（外送速食）

請從以下莫蘭迪色票中選出最適合的一個：
霧玫瑰 #C9A69A, 灰藍 #8FA3B1, 鼠尾草綠 #9CAF96, 燕麥 #C4B49A, 藕紫 #B5A8C0, 霧杏 #D4B8A0, 灰綠 #A3B5A6, 玫瑰灰 #B8A5A5

只回傳 JSON，不要其他文字：
{"icon": "Coffee", "color": "#C4B49A"}`,
      },
    ],
    max_tokens: 60,
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

  return {
    icon: parsed.icon ?? 'ShoppingBag',
    color: parsed.color ?? '#C4B49A',
  }
})
