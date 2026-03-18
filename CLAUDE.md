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
- 風格：圓角 pill、輕陰影、半透明 surface
- 類別 icon：Lucide Vue Next（165 個 icon，15 個語意群組）
- 類別顏色：莫蘭迪色票（66 個中淺色，L 45–88%）

## Design Token 系統
專案使用三層 token 架構（primitive → semantic → component），定義於 `tokens.json`。

### 核心顏色
- Accent：`--accent` = `#E07A4F`（`semantic.color.accent`）
- Accent dark：`--accent-dark` = `#C4622D`（`semantic.color.accent-dark`）
- Destructive：`#D04A20`（`semantic.color.destructive`）— 登出、錯誤提示
- Primary text：`--text` = `#8B5E3C`（`semantic.color.text-primary`）
- Soft text：`--text-soft` = `#B18272`（`semantic.color.text-secondary`）
- Strong text：`#3D2314`（`semantic.color.text-strong`）
- Surface：`rgba(255,255,255,0.80)`（`semantic.color.surface`）
- Surface solid：`#FFF8F2`（`semantic.color.surface-solid`）
- Border：`rgba(196,168,130,0.25)`（`semantic.color.border`）

### 字型
- UI 字型：`'Noto Sans TC', sans-serif`（`primitive.font-family.sans`）
- Mono 字型：`'Chivo Mono', monospace`（`primitive.font-family.mono`）

### 字級（semantic）
| Token | 大小 | 用途 |
|-------|------|------|
| `size-display` | 42px | 首頁大標題、分析結果頁 |
| `size-amount-hero` | 28px | 重要顯目金額 |
| `size-title` | 16px | 首頁說明文、登入頁標題、日期 |
| `size-input` | 16px | input 欄位（iOS anti-zoom） |
| `size-body` | 14px | 按鈕文字、分類標題、消費項目、消費金額 |
| `size-label` | 12px | nav label、登入說明、輔助說明、類別、數據說明 |
| `size-chart-label` | 10px | 圖表軸線文字 |

### 圓角
- `interactive`：16px（按鈕、互動元素）
- `card`：24px（卡片、modal）
- `pill`：100px（pill 形按鈕、input bar）
- `avatar`：50%（圓形）

### 刻意保留的 hardcoded 值（不屬於 token 管轄）
- Animation orb keyframes 的 rgba 顏色（動畫系統專用）
- `rgba(224, 122, 79, 0.08/0.1/0.15)` hover/背景 tint
- SVG fill 顏色（`#E07A4F`、`#90C8A0`）— CSS vars 無法用於 SVG style 屬性
- `#e0ccba` 數據條底色（per DECISIONS.md spec）
- `#E8E0D8` ratio bar 背景

## 頁面結構
- **首頁**：兩個 tab（紀錄／查詢）+ 輸入列（文字、語音、相機）
- **紀錄頁**：月份切換 + 支出總計 + 流水帳單（icon + 項目名稱 + 類別小字 + 金額）
- **查詢結果頁**：標題區 + 總結區 + 清單區，底部繼續查詢輸入列
- **分析頁**：週／月／年切換 + 月份導航 + 類別支出（百分比 + 金額）+ 趨勢折線圖
- **帳號頁**：未登入顯示登入/註冊入口；已登入顯示 Email + 登出
- **登入/註冊頁**：Email + 密碼，Supabase Auth
- **Nav**：首頁、紀錄、分析、帳號

## 重要檔案路徑
- `tokens.json` — Design token 單一來源（primitive / semantic / component 三層）
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
- [x] 查詢結果頁 analysis_full（模糊分析意圖：總計、佔比數據條、與上月比較、消費明細、趨勢圖）
- [x] 查詢結果頁 analysis_compare（上週 vs 上上週，週一到週日，server 端直接計算日期不依賴 GPT 解析；單一週期問句不觸發比較模式）
- [x] 查詢結果頁 analysis_peak（高低峰日卡片 + BarChart，總結區三維度：最高消費項目／類別／日）
- [x] 動態背景移至 layouts/default.vue（全頁共用，各頁面背景保持透明）
- [x] Design token 系統建立（tokens.json，三層架構，已套用至全專案）

## 注意事項
- 所有頁面最大寬度 430px，margin auto 置中
- 手機文字輸入字級統一 16px 防止 iOS 縮放（`semantic.typography.size-input`）
- 語音辨識語言設定為 zh-TW
- .env 不上傳 GitHub，Vercel 環境變數需手動設定
- SSR 環境下不可直接讀取 localStorage，需在 onMounted 或 process.client 判斷後執行
- 「上週」日期計算在 server 端直接用 JS 計算（以本週週一往回推），不信任 GPT 解析的日期輸出

## 開發規範
在進行任何新增或修改前，請遵守以下規則：
1. **只動指定的檔案**：本次任務只修改或新增任務中明確指定的檔案，未被提及的檔案一律不動。
2. **樣式不外溢**：新增的樣式只作用於新元件或新頁面，不修改任何現有的 Tailwind class、CSS 變數、或全域樣式檔案。
3. **共用元件不改動**：如果任務需要使用現有元件，只引用，不修改原始元件檔案。
4. **路由不異動**：不新增、不刪除、不修改現有頁面的路由設定，除非任務明確要求。
5. **Token 優先**：新增樣式時，優先使用 `tokens.json` 裡定義的 semantic token 值，不新增 hardcoded 顏色或字級。
6. **完成後列出變更清單**：任務完成後，列出所有新增與修改的檔案路徑，方便 review。

## 樣式保護規則（查詢結果頁）
以下樣式已定案，任何任務都不得更動：
- **背景**：所有區塊背景永遠透明，漸層動畫來自 `layouts/default.vue`，禁止在任何元件加背景色
- **Header 區 / 總結區**：透明背景，禁止加 `background`、`bg-*`、`backdrop-*`
- **Accent**：`var(--accent)`（`#E07A4F`），數字色：`var(--text)`（`#8B5E3C`），輔助文字：`var(--text-soft)`（`#B18272`）
- **數據條**：底色 `#e0ccba`，三層疊層結構（灰底 → 類別色 → 橘色），不可改變層數或顏色
- **分隔線**：`rgba(196,168,130,0.25)`，不可加深或改色
- **間距**：所有區塊 padding `24px`，區塊間距 `24px`，不可縮減
- **字級**：全頁統一 `12px`，明細日期 `12px`（M/D 格式），不可改回 11px
- **趨勢圖軸標籤**：`var(--text-soft)` 即 `#B18272`
- **趨勢圖線條顏色**：使用 `catColor(類別名稱)` 取得對應類別色，不可使用固定色
