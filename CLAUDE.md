# Flow 記帳 PWA — 專案 Context

## 專案定位
一個以 AI 互動為核心的記帳 PWA，核心設計原則是：**AI 觀察與建議，人來決定**。
不取代使用者的判斷，而是降低記帳的摩擦力，讓記帳行為真正發生。

## 技術棧
- **Framework**：Nuxt 3（Vue 3 Composition API）
- **資料庫**：Supabase（PostgreSQL）
- **樣式**：Tailwind CSS + CSS custom properties
- **部署**：Vercel
- **AI 功能**：GPT-4o Vision（拍照辨識）、Web Speech API（語音輸入）

## 設計語言
- 背景：暖橙漸層，三個動態色球（黃暖光、橘光、桃光）
- Accent color：`#E07A4F`
- 字型：Noto Serif TC（標題）、Noto Sans TC（內文）
- 風格：圓角 pill、輕陰影、半透明 surface

## 頁面結構
- **首頁**：三個 tab（紀錄／統計／分析）+ 輸入列（文字、語音、相機）
- **當前紀錄頁**：三種輸入模式共用，底部 action bar 根據模式變形
- **完成頁**：checkmark + 筆數，3 秒後回首頁
- **Nav**：首頁、紀錄、分析、帳號

## 目前進度
- [x] 首頁 UI 與三個 tab 切換
- [x] 文字輸入流程
- [x] 語音輸入（Web Speech API，zh-TW）
- [x] 拍照畫面（getUserMedia 後鏡頭，全螢幕 + 遮罩）
- [x] 當前紀錄頁面（編輯、刪除、disabled 狀態）
- [x] 完成頁面（3 秒自動回首頁，nav 紅點）
- [x] Vercel 部署
- [ ] GPT-4o 拍照辨識串接
- [ ] Supabase 資料寫入與讀取
- [ ] 統計查詢（自然語言 → Supabase 查詢）
- [ ] Nav 紀錄頁（流水帳單）
- [ ] Nav 分析頁（月份類別比例）

## 注意事項
- 所有頁面最大寬度 430px，margin auto 置中
- 統計和分析 tab 不需要相機按鈕
- 語音辨識語言設定為 zh-TW
- .env 不上傳 GitHub，Vercel 環境變數需手動設定
