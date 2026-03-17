# Flow 記帳 PWA — 專案 Context

## 專案定位
一個以 AI 互動為核心的記帳 PWA，核心設計原則是：**AI 觀察與建議，人來決定**。
不取代使用者的判斷，而是降低記帳的摩擦力，讓記帳行為真正發生。

## 技術棧
- **Framework**：Nuxt 3（Vue 3 Composition API）
- **資料庫**：Supabase（PostgreSQL）
- **樣式**：Tailwind CSS + CSS custom properties
- **部署**：Vercel
- **AI 功能**：GPT-4o Vision（拍照辨識）、Web Speech API（語音輸入）、GPT-4o（文字解析、查詢、類別建議）

## 設計語言
- 背景：暖橙漸層，三個動態色球（黃暖光、橘光、桃光）
- Accent color：`#E07A4F`（--accent）、Accent dark：`#C4622D`（--accent-dark）
- 字型：Noto Serif TC（標題）、Noto Sans TC（內文）
- 風格：圓角 pill、輕陰影、半透明 surface
- 類別 icon：Lucide Vue Next（165 個 icon，15 個語意群組）
- 類別顏色：莫蘭迪色票（66 個中淺色，L 45–88%）

## 頁面結構
- **首頁**：兩個 tab（紀錄／查詢）+ 輸入列（文字、語音、相機）
- **紀錄頁**：月份切換 + 支出總計 + 流水帳單（icon + 項目名稱 + 類別小字 + 金額）
- **查詢結果頁**：標題區 + 總結區 + 清單區，底部繼續查詢輸入列
- **分析頁**：週／月／年切換 + 月份導航 + 類別支出（百分比 + 金額）+ 趨勢折線圖
- **帳號頁**：未登入顯示登入/註冊入口；已登入顯示 Email + 登出
- **登入/註冊頁**：Email + 密碼，Supabase Auth
- **Nav**：首頁、紀錄、分析、帳號

## 重要檔案路徑
- `pages/index.vue` — 首頁
- `pages/records.vue` — 紀錄頁
- `pages/query-result.vue` — 查詢結果頁
- `pages/analysis.vue` — 分析頁
- `pages/account.vue` — 帳號頁
- `pages/auth.vue` — 登入/註冊頁
- `components/EditSheet.vue` — 編輯消費項目 + 類別選擇 + 新增/編輯類別
- `components/RecordTable.vue` — 紀錄清單元件
- `components/CatIcon.vue` — 類別 icon 元件（自動判斷 Lucide 或 SVG）
- `constants/categories.ts` — 預設類別、catColor()、catPath()、catLucideIcon()
- `constants/lucide-icons.ts` — Lucide icon 群組清單（15 群組，165 個 icon）
- `constants/morandi-colors.json` — 莫蘭迪色票（66 個）
- `composables/useRecords.ts` — 消費紀錄 CRUD
- `composables/useUserCategories.ts` — 自訂類別狀態管理（Supabase + localStorage fallback）
- `server/api/parse-entry.post.ts` — 文字解析 AI
- `server/api/query-expenses.post.ts` — 查詢 AI
- `server/api/suggest-category.post.ts` — 類別 icon/色 AI
- `middleware/auth.global.ts` — 不強制登入，訪客可直接使用

## 資料庫結構
### expenses 表
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| name | text | 消費名稱 |
| amount | integer | 金額 |
| category | text | 類別名稱 |
| input_method | text | 輸入方式 |
| created_at | timestamptz | 建立時間 |
| user_id | uuid | 允許 null（訪客模式） |

### categories 表
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 auth.users |
| name | text | 類別名稱 |
| icon | text | Lucide icon 名稱 |
| color | text | 莫蘭迪色碼 |
| sort_order | integer | 排列順序 |
| created_at | timestamptz | 建立時間 |

RLS 已啟用，兩張表都限制 `auth.uid() = user_id`。

## 登入 / 訪客模式
- 訪客：消費紀錄存 Supabase（user_id = null）、自訂類別存 localStorage
- 已登入：消費紀錄和自訂類別都存 Supabase
- 登入時自動合併：localStorage 的消費紀錄和類別 merge 到 Supabase（localStorage 資料優先）
- Confirm email 已關閉（Supabase 設定）

## 目前進度
- [x] 首頁 UI 與 tab 切換（紀錄／查詢）
- [x] 文字輸入流程（AI 解析 → 確認 → 儲存）
- [x] 語音輸入（Web Speech API，zh-TW，5 秒 silence timeout）
- [x] 拍照辨識（GPT-4o Vision，嚴格 prompt 不自行推測品項）
- [x] 紀錄頁面（月份切換、流水帳單、編輯、刪除）
- [x] 分析頁（週/月/年切換、類別佔比、趨勢折線圖）
- [x] 自然語言查詢（多關鍵字、語意擴展、top_n/ranking/list/grouped）
- [x] 查詢結果頁（標題粗體關鍵字橘色、總結區、清單區）
- [x] 帳號系統（Supabase Auth、登入/註冊/登出）
- [x] 自訂類別（新增/編輯/刪除，AI 推薦 icon + 莫蘭迪色）
- [x] 類別遷移到 Supabase categories 表（跨瀏覽器同步）
- [x] 訪客模式資料合併（登入時 merge localStorage → Supabase）
- [x] AI 安全防護（off-topic 拒絕、prompt injection 防護、輸入長度限制）

## 注意事項
- 所有頁面最大寬度 430px，margin auto 置中
- 手機文字輸入字級統一 16px 防止 iOS 縮放（待優化）
- 語音辨識語言設定為 zh-TW
- .env 不上傳 GitHub，Vercel 環境變數需手動設定
- SSR 環境下不可直接讀取 localStorage，需在 onMounted 或 process.client 判斷後執行

## 🔒 樣式保護規則（禁止修改）

以下樣式已定案，**任何任務都絕對不得修改**，即使任務描述沒有明確禁止：

### 全域背景
- 所有頁面背景為暖橙漸層動畫（三個動態色球），定義於全域 layout
- **禁止**在任何頁面或元件加上額外的背景色、背景層、或覆蓋漸層的色塊

### 頁面各區域背景規則
- **Header 區**（標題、日期、月份切換器等）：透明背景，直接顯示漸層，禁止加背景色
- **總結區**（query-result 的總計、佔比數據條等）：透明背景，禁止加卡片背景或白色底層
- **清單區**（消費明細卡片）：維持現有半透明白色卡片樣式，禁止更改
- **Nav**：維持現有樣式，禁止更改

### 禁止修改的 CSS 項目
- 全域字型設定（Noto Serif TC / Noto Sans TC）
- Accent 色碼（`#E07A4F`、`#C4622D`）
- 頁面最大寬度（430px）
- Nav 高度與樣式
- 任何已存在的全域 CSS class 或 CSS 變數

### 執行前自我檢查（每次任務開始前必做）
1. 本次修改是否只影響指定的 HTML 結構和新增的 CSS class？
2. 是否有新增任何背景色、卡片底色到原本透明的區域？
3. 是否修改了任何現有的 CSS class？

如果第 2 或第 3 項答案為「是」，請停止並重新評估修改範圍，不得繼續執行。

---

## 開發規範
在進行任何新增或修改前，請遵守以下規則：
1. **只動指定的檔案**：本次任務只修改或新增任務中明確指定的檔案，未被提及的檔案一律不動。
2. **樣式不外溢**：新增的樣式只作用於新元件或新頁面，不修改任何現有的 Tailwind class、CSS 變數、或全域樣式檔案。
3. **共用元件不改動**：如果任務需要使用現有元件，只引用，不修改原始元件檔案。
4. **路由不異動**：不新增、不刪除、不修改現有頁面的路由設定，除非任務明確要求。
5. **最小範圍修改**：只新增必要的 HTML 結構和對應的新 CSS class，不重構現有程式碼。
6. **完成後列出變更清單**：任務完成後，列出所有新增與修改的檔案路徑及修改的行數範圍，方便 review。
7. **樣式保護優先**：遇到任何樣式相關的修改，先對照上方「🔒 樣式保護規則」確認不違反禁止項目，再動手。
