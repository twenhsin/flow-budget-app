export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // 兩種方式都嘗試讀取 API key
  const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || ''

  const { image } = await readBody(event)

  console.log('[analyze-receipt] config.openaiApiKey 前10碼:', config.openaiApiKey?.slice(0, 10) ?? '❌ 空')
  console.log('[analyze-receipt] process.env.OPENAI_API_KEY 前10碼:', process.env.OPENAI_API_KEY?.slice(0, 10) ?? '❌ 空')
  console.log('[analyze-receipt] 最終使用 apiKey 前10碼:', apiKey.slice(0, 10) || '❌ 完全沒有')
  console.log('[analyze-receipt] image 長度:', image?.length ?? 0)
  console.log('[analyze-receipt] image 前30字:', image?.slice(0, 30) ?? '(空)')

  if (!apiKey) {
    console.error('[analyze-receipt] ❌ API key 完全未取得，請確認 .env 有 OPENAI_API_KEY')
    throw createError({ statusCode: 500, message: 'OPENAI_API_KEY 未設定' })
  }

  if (!image) {
    throw createError({ statusCode: 400, message: '缺少圖片資料' })
  }

  const requestBody = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '這是一張台灣的收據，請辨識出實際購買的商品項目（排除合計、小計、現金、找零、稅金等非商品行），每個項目回傳名稱和金額。回傳純 JSON 格式，不要加任何說明文字或 markdown：{"items": [{"name": "項目名稱", "amount": 金額數字, "category": "類別"}]}，類別只能從以下選擇：餐飲、飲料、點心、居住、休閒、交通、通訊、其他。如果無法辨識，回傳 {"items": []}',
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${image}` },
          },
        ],
      },
    ],
    max_tokens: 1000,
  }

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })
  }
  catch (fetchErr) {
    console.error('[analyze-receipt] fetch 網路錯誤:', fetchErr)
    throw createError({ statusCode: 502, message: 'fetch 失敗' })
  }

  const rawText = await response.text()
  console.log('[analyze-receipt] HTTP status:', response.status)
  console.log('[analyze-receipt] 回應內容:', rawText)

  if (!response.ok) {
    console.error('[analyze-receipt] OpenAI 錯誤 HTTP', response.status, ':', rawText)
    // 把完整錯誤訊息傳回客戶端方便 debug
    throw createError({
      statusCode: 502,
      message: `OpenAI ${response.status}`,
      data: { status: response.status, body: rawText },
    })
  }

  let data: any
  try {
    data = JSON.parse(rawText)
  }
  catch {
    console.error('[analyze-receipt] JSON parse 失敗:', rawText)
    throw createError({ statusCode: 502, message: '回應非 JSON' })
  }

  const message = data.choices?.[0]?.message
  const refusal = message?.refusal
  const content = message?.content ?? ''

  console.log('[analyze-receipt] GPT content 原始值:', JSON.stringify(content))
  console.log('[analyze-receipt] GPT refusal:', refusal ?? '(無)')

  // GPT 拒絕回應（例如圖片非收據），回傳空白項目讓用戶手動輸入
  if (refusal) {
    console.log('[analyze-receipt] GPT 拒絕辨識，回傳 fallback')
    return { items: [{ name: '', amount: 0, category: '其他' }], fallback: true }
  }

  // 去掉 markdown code block（```json ... ``` 或 ``` ... ```）
  const stripped = content
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim()

  console.log('[analyze-receipt] stripped content:', JSON.stringify(stripped))

  // 嘗試直接 parse
  try {
    return JSON.parse(stripped)
  }
  catch {
    console.log('[analyze-receipt] 直接 parse 失敗，嘗試 regex 提取')
  }

  // regex 提取第一個 { ... }
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    }
    catch (e) {
      console.error('[analyze-receipt] regex 提取後 parse 失敗:', e, '提取內容:', jsonMatch[0])
    }
  }
  else {
    console.error('[analyze-receipt] regex 找不到 JSON，stripped:', JSON.stringify(stripped))
  }

  throw createError({ statusCode: 502, message: '無法解析辨識結果' })
})
