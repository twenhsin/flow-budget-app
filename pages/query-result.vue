<template>
  <div class="qr-screen">
    <!-- Header -->
    <div class="qr-header">
      <div class="qr-title">{{ result.title }}</div>
      <div class="qr-sub">{{ formattedRange }}</div>
    </div>

    <!-- Total -->
    <div class="qr-total">
      <span class="qr-total-label">總計</span>
      <span class="qr-total-amount">-{{ formatAmount(result.total) }}</span>
    </div>

    <!-- Content -->
    <div class="qr-body">
      <!-- total / list: item list -->
      <template v-if="result.queryType === 'total' || result.queryType === 'list'">
        <div class="item-card">
          <div v-for="item in result.items" :key="item.id" class="item-row">
            <div class="item-icon" :style="{ background: catColor(item.category) }">
              <CatIcon :category="item.category" :size="14" :stroke-width="1.8" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-cat">{{ item.category }}</span>
            </div>
            <span class="item-amount">-{{ formatAmount(item.amount) }}</span>
          </div>
          <div v-if="result.items.length === 0" class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- ranking: horizontal bar chart -->
      <template v-else-if="result.queryType === 'ranking'">
        <div class="item-card">
          <div v-for="r in rankingData" :key="r.cat" class="rank-row">
            <div class="rank-label">
              <div class="item-icon" :style="{ background: catColor(r.cat) }">
                <CatIcon :category="r.cat" :size="14" :stroke-width="1.8" />
              </div>
              <span class="rank-name">{{ r.cat }}</span>
            </div>
            <div class="rank-bar-wrap">
              <div
                class="rank-bar"
                :style="{ width: `${r.pct}%`, background: catColor(r.cat) }"
              />
            </div>
            <span class="rank-amount">{{ formatAmount(r.amount) }}</span>
          </div>
          <div v-if="rankingData.length === 0" class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- grouped: per-keyword sections -->
      <template v-else-if="result.queryType === 'grouped'">
        <div
          v-for="(g, gi) in result.groups"
          :key="g.label"
          class="item-card"
          :class="{ 'group-gap': gi > 0 }"
        >
          <div class="group-header">
            <span class="group-label">{{ groupDisplayLabel(g) }}</span>
            <span class="group-total">-{{ formatAmount(g.total) }}</span>
          </div>
          <div class="group-divider" />
          <div v-for="item in g.items" :key="item.id" class="item-row">
            <div class="item-icon" :style="{ background: catColor(item.category) }">
              <CatIcon :category="item.category" :size="14" :stroke-width="1.8" />
            </div>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-cat">{{ item.category }}</span>
            </div>
            <span class="item-amount">-{{ formatAmount(item.amount) }}</span>
          </div>
          <div v-if="g.items.length === 0" class="item-empty">無符合紀錄</div>
        </div>
        <div v-if="result.groups.length === 0" class="item-card">
          <div class="item-empty">此期間無紀錄</div>
        </div>
      </template>

      <!-- monthly: vertical bar chart (SVG) -->
      <template v-else-if="result.queryType === 'monthly'">
        <div class="item-card chart-card">
          <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="monthly-svg">
            <!-- Grid lines + Y labels -->
            <line
              v-for="g in yGrid"
              :key="g.chartY"
              :x1="SVG_L"
              :y1="g.chartY"
              :x2="SVG_W - SVG_R"
              :y2="g.chartY"
              stroke="rgba(0,0,0,0.07)"
              stroke-width="0.8"
            />
            <text
              v-for="g in yGrid"
              :key="'y' + g.chartY"
              x="0"
              :y="g.chartY + 3"
              text-anchor="start"
              font-size="8"
              fill="#B0A090"
            >{{ g.label }}</text>
            <!-- Bars -->
            <rect
              v-for="(b, i) in monthlyBars"
              :key="i"
              :x="b.x"
              :y="b.y"
              :width="b.w"
              :height="b.h"
              rx="2"
              :fill="b.h > 0 ? '#E07A4F' : 'transparent'"
              opacity="0.85"
            />
            <!-- X labels -->
            <text
              v-for="(b, i) in monthlyBars"
              :key="'x' + i"
              :x="b.x + b.w / 2"
              :y="SVG_H - 3"
              text-anchor="middle"
              font-size="7"
              fill="#B0A090"
            >{{ b.label }}</text>
          </svg>
        </div>
      </template>
    </div>

    <!-- Bottom input bar -->
    <div class="qr-input-wrap">
      <ListeningIndicator :visible="isListening" :transcript="interimTranscript" />
      <div class="qr-input-row">
        <button class="qr-back-btn" @click="navigateTo('/')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div class="qr-input-bar">
        <input
          ref="inputRef"
          v-model="inputValue"
          class="qr-input"
          :placeholder="isLoading ? 'AI 分析中...' : '繼續查詢...'"
          :disabled="isLoading"
          enterkeyhint="done"
          @keydown.enter="handleSubmit"
        >
        <button class="qr-add-btn" :disabled="!inputValue.trim() || isLoading" @click="handleSubmit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div class="qr-icons">
          <button class="qr-icon-btn" :class="{ active: isListening }" :disabled="isLoading" @click="toggleVoice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
          </button>
        </div>
        </div>
      </div>
      <div v-if="errorMsg" class="qr-error">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getGuestExpenses } from '~/composables/useGuestExpenses'

definePageMeta({ layout: 'bare' })

// ── State ─────────────────────────────────────────────────────────────────────
interface GroupEntry {
  label: string
  total: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
}

interface QueryResult {
  title: string
  queryType: 'total' | 'list' | 'ranking' | 'monthly' | 'grouped'
  total: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
  groups: GroupEntry[]
  dateFrom: string
  dateTo: string
}

const result = useState<QueryResult>('queryResult', () => ({
  title: '',
  queryType: 'total',
  total: 0,
  items: [],
  groups: [],
  dateFrom: '',
  dateTo: '',
}))

const inputValue = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const { isListening, interimTranscript, stopVoice, toggleVoice } = useVoiceInput({
  onFinal: (text) => { inputValue.value = text },
  onInterim: (text) => { inputValue.value = text },
})

// ── Formatters ────────────────────────────────────────────────────────────────
function formatAmount(n: number) { return n.toLocaleString('zh-TW') }

function formatDate(d: string) {
  return d ? d.replace(/-/g, '/') : ''
}

const formattedRange = computed(() =>
  `${formatDate(result.value.dateFrom)} ～ ${formatDate(result.value.dateTo)}`,
)

// ── Query ─────────────────────────────────────────────────────────────────────
import { catColor as catColorBuiltin } from '~/constants/categories'
const user = useSupabaseUser()
const { categories, getCatColor, load: loadCategories } = useUserCategories()
const catColor = (name: string) => getCatColor(name) ?? catColorBuiltin(name)

const handleSubmit = async () => {
  const q = inputValue.value.trim()
  if (!q || isLoading.value) return
  stopVoice()
  inputValue.value = ''
  isLoading.value = true
  errorMsg.value = ''

  try {
    const body: Record<string, unknown> = {
      question: q,
      userCategories: categories.value.map(c => c.name),
    }
    if (!user.value) body.guestExpenses = getGuestExpenses()
    const data = await $fetch<QueryResult>('/api/query-expenses', {
      method: 'POST',
      body,
    })
    result.value = data
  }
  catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message ?? '查詢失敗，請再試一次'
    errorMsg.value = msg
    setTimeout(() => { errorMsg.value = '' }, 4000)
  }
  finally {
    isLoading.value = false
  }
}

// grouped 分組標題：優先顯示紀錄的實際 category 名稱
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupDisplayLabel(g: GroupEntry): string {
  if (g.items.length === 0) return g.label
  const cats = [...new Set(g.items.map((item: any) => item.category as string))]
  return cats.length === 1 ? cats[0] : g.label
}

onMounted(async () => {
  await loadCategories()
})

// ── Ranking data ───────────────────────────────────────────────────────────────
const rankingData = computed(() => {
  const totals: Record<string, number> = {}
  for (const r of result.value.items) {
    totals[r.category] = (totals[r.category] ?? 0) + r.amount
  }
  const max = Math.max(...Object.values(totals), 1)
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({ cat, amount, pct: Math.round((amount / max) * 100) }))
})

// ── Monthly chart ──────────────────────────────────────────────────────────────
const SVG_W = 300
const SVG_H = 130
const SVG_L = 30
const SVG_R = 6
const SVG_T = 10
const SVG_B = 24
const SVG_CH = SVG_H - SVG_T - SVG_B

const monthlyTotals = computed(() => {
  const map: Record<string, number> = {}
  for (const r of result.value.items) {
    const key = r.created_at.slice(0, 7) // YYYY-MM
    map[key] = (map[key] ?? 0) + r.amount
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
})

const niceMax = computed(() => {
  const max = Math.max(...monthlyTotals.value.map(([, v]) => v), 1)
  if (max < 1000) return Math.ceil(max / 200) * 200
  if (max < 10000) return Math.ceil(max / 1000) * 1000
  if (max < 100000) return Math.ceil(max / 10000) * 10000
  return Math.ceil(max / 50000) * 50000
})

function formatYLabel(n: number) {
  if (n === 0) return '0'
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return `${n}`
}

const yGrid = computed(() => {
  const max = niceMax.value
  return [0, 1, 2, 3, 4].map((i) => {
    const ratio = i / 4
    const val = Math.round(max * (1 - ratio))
    const chartY = SVG_T + ratio * SVG_CH
    return { chartY, label: formatYLabel(val) }
  })
})

const monthlyBars = computed(() => {
  const data = monthlyTotals.value
  const n = data.length
  if (n === 0) return []
  const max = niceMax.value
  const chartW = SVG_W - SVG_L - SVG_R
  const barW = Math.min((chartW / n) * 0.6, 24)
  const gap = chartW / n
  return data.map(([key, val], i) => {
    const barH = max > 0 ? (val / max) * SVG_CH : 0
    const x = SVG_L + gap * i + (gap - barW) / 2
    const y = SVG_T + SVG_CH - barH
    return { x, y, w: barW, h: barH, label: key.slice(2).replace('-', '/') }
  })
})
</script>

<style scoped>
.qr-screen {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: linear-gradient(160deg, #FDF0E6 0%, #FBDFC8 55%, #F5C8A8 100%);
}

/* Header */
.qr-header {
  flex-shrink: 0;
  padding: 48px 24px 0;
}

.qr-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 22px;
  font-weight: 300;
  color: var(--text);
  margin-bottom: 4px;
}

.qr-sub {
  font-size: 12px;
  color: var(--text-soft);
  letter-spacing: 0.04em;
}

/* Total */
.qr-total {
  flex-shrink: 0;
  padding: 20px 24px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qr-total-label {
  font-size: 14px;
  color: var(--text-soft);
}

.qr-total-amount {
  font-family: 'Chivo Mono', monospace;
  font-size: 40px;
  font-weight: 700;
  color: #8B5E3C;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* Body */
.qr-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 16px;
}

/* Card */
.item-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 16px rgba(196, 98, 45, 0.08);
  overflow: hidden;
  padding: 4px 0;
}

.chart-card {
  padding: 12px 8px 8px;
}

/* Item list (total / list) */
.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}

.item-row + .item-row {
  border-top: 1px solid var(--border);
}

.item-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}


.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-name {
  font-size: 14px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-cat {
  font-size: 11px;
  color: var(--text-soft);
}

.item-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-empty {
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-soft);
}

/* Ranking rows */
.rank-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}

.rank-row + .rank-row {
  border-top: 1px solid var(--border);
}

.rank-label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 72px;
  flex-shrink: 0;
}

.rank-name {
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
}

.rank-bar-wrap {
  flex: 1;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.rank-amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
  width: 56px;
  text-align: right;
}

/* Grouped sections */
.group-gap {
  margin-top: 10px;
}

.group-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 14px 16px 12px;
}

.group-label {
  font-size: 13px;
  color: #B18272;
}

.group-total {
  font-size: 22px;
  font-weight: 700;
  color: #8B5E3C;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.group-divider {
  height: 1px;
  background: var(--border);
  margin: 0 16px;
}

/* Monthly chart */
.monthly-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* Bottom input */
.qr-input-wrap {
  flex-shrink: 0;
  padding: 8px 16px calc(24px + env(safe-area-inset-bottom));
}

.qr-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qr-back-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(224, 122, 79, 0.4);
  background: rgba(255, 255, 255, 0.8);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.18s;
}

.qr-back-btn:active { transform: scale(0.88); }

.qr-back-btn svg {
  width: 18px;
  height: 18px;
}

.qr-input-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-pill);
  padding: 4px 4px 4px 20px;
  box-shadow: 0 2px 16px rgba(196, 98, 45, 0.1);
}

.qr-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 300;
  color: var(--text);
  outline: none;
}

.qr-input::placeholder {
  color: var(--text-soft);
}

.qr-input:disabled {
  opacity: 0.6;
}

.qr-add-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #EC844C;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.18s;
}

.qr-add-btn:active { transform: scale(0.88); }

.qr-add-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.qr-add-btn svg {
  width: 20px;
  height: 20px;
}

.qr-icons {
  display: flex;
  align-items: center;
  border: 1px solid rgba(224, 122, 79, 0.4);
  border-radius: 40px;
  padding: 2px;
  flex-shrink: 0;
}

.qr-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #EC844C;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.18s;
  flex-shrink: 0;
}

.qr-icon-btn:active { transform: scale(0.88); }

.qr-icon-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.qr-icon-btn.active {
  color: var(--text);
  animation: mic-pulse 1.5s ease infinite;
}

.qr-icon-btn svg {
  width: 20px;
  height: 20px;
}

.qr-error {
  margin-top: 8px;
  text-align: center;
  font-size: 13px;
  color: rgba(200, 60, 60, 0.9);
}
</style>
