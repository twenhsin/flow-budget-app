export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { image } = await readBody(event)

  if (!image) {
    throw createError({ statusCode: 400, message: '缺少圖片資料' })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '這是一張台灣的收據或消費照片，請辨識出所有消費項目，回傳 JSON 格式：{"items": [{"name": "項目名稱", "amount": 金額數字, "category": "類別"}]}，類別只能從以下選擇：餐飲、飲料、點心、居住、休閒、交通、通訊、其他。只回傳 JSON，不要其他文字。',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw createError({ statusCode: 502, message: 'OpenAI API 呼叫失敗' })
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? ''

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('no json')
    return JSON.parse(jsonMatch[0])
  }
  catch {
    throw createError({ statusCode: 502, message: '無法解析辨識結果' })
  }
})
