<template>
  <div class="analysis-screen">
    <div class="orb orb-1" aria-hidden="true" />
    <div class="orb orb-2" aria-hidden="true" />
    <div class="orb orb-3" aria-hidden="true" />

    <!-- Fixed header -->
    <div class="analysis-header">
      <div class="dim-tabs">
        <button
          v-for="d in DIMS"
          :key="d.value"
          class="dim-tab"
          :class="{ active: dimension === d.value }"
          @click="setDimension(d.value)"
        >
          {{ d.label }}
        </button>
      </div>
      <div class="period-nav">
        <button class="period-arrow" @click="prevPeriod">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class="period-label">{{ periodLabel }}</span>
        <button class="period-arrow" @click="nextPeriod">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Scrollable body -->
    <div class="analysis-body">
      <div v-if="isLoading" class="empty-msg">載入中...</div>
      <template v-else>
        <div class="stat-card">
          <!-- Total expense -->
          <div class="card-section total-section">
            <span class="total-label">{{ totalLabel }}</span>
            <span class="total-amount">{{ totalAmountStr }}</span>
          </div>

          <div v-if="totalExpense === 0" class="card-empty">本期無紀錄</div>
          <template v-else>
            <div class="card-divider" />

            <!-- Category breakdown -->
            <div class="card-section">
              <div class="section-title">各類別支出</div>
              <div class="cat-bar-wrap">
                <div
                  v-for="cat in categoryData"
                  :key="cat.cat"
                  class="cat-bar-seg"
                  :style="{ flex: cat.amount, background: catColor(cat.cat) }"
                />
              </div>
              <div v-for="cat in categoryData" :key="cat.cat" class="cat-row">
                <div class="cat-icon" :style="{ background: catColor(cat.cat) }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" v-html="catPaths(cat.cat)" />
                </div>
                <span class="cat-name">{{ cat.cat }} <span class="cat-pct">{{ cat.pct }}%</span></span>
                <span class="cat-amount">-{{ formatAmount(cat.amount) }}</span>
              </div>
            </div>

            <div class="card-divider" />

            <!-- Trend chart -->
            <div class="card-section">
              <div class="section-title">本期支出趨勢</div>
              <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="trend-svg">
                <!-- Grid lines -->
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
                <!-- Y axis labels -->
                <text
                  v-for="g in yGrid"
                  :key="'yl' + g.chartY"
                  x="0"
                  :y="g.chartY + 3"
                  text-anchor="start"
                  font-size="8"
                  fill="#B0A090"
                >{{ g.label }}</text>
                <!-- Area fill under line -->
                <polygon
                  v-if="chartPoints.length > 1"
                  :points="areaPolyStr"
                  fill="rgba(196,98,45,0.09)"
                />
                <!-- Line -->
                <polyline
                  v-if="chartPoints.length > 1"
                  :points="linePolyStr"
                  fill="none"
                  stroke="#C4622D"
                  stroke-width="1.8"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                <!-- Data point dots -->
                <circle
                  v-for="(p, i) in chartPoints"
                  :key="i"
                  :cx="p.x"
                  :cy="p.y"
                  r="2.8"
                  fill="#C4622D"
                />
                <!-- X axis labels -->
                <text
                  v-for="(p, i) in chartPoints"
                  :key="'xl' + i"
                  :x="p.x"
                  :y="SVG_H - 3"
                  text-anchor="middle"
                  font-size="8"
                  fill="#B0A090"
                >{{ xLabels[i] }}</text>
              </svg>
            </div>
          </template>
        </div>
      </template>
    </div>

    <div class="nav-spacer" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()

// ── SVG chart constants ──────────────────────────────────────────────────────
const SVG_W = 300
const SVG_H = 120
const SVG_L = 30   // left pad (y-axis labels)
const SVG_R = 6    // right pad
const SVG_T = 10   // top pad
const SVG_B = 22   // bottom pad (x-axis labels)
const SVG_CW = SVG_W - SVG_L - SVG_R  // 264
const SVG_CH = SVG_H - SVG_T - SVG_B  // 88

// ── Dimension ────────────────────────────────────────────────────────────────
type Dimension = 'week' | 'month' | 'year'
const DIMS = [
  { value: 'week' as Dimension, label: '週' },
  { value: 'month' as Dimension, label: '月' },
  { value: 'year' as Dimension, label: '年' },
]
const dimension = ref<Dimension>('month')

// ── Period state ─────────────────────────────────────────────────────────────
const today = new Date()

// Month mode
const mYear = ref(today.getFullYear())
const mMonth = ref(today.getMonth() + 1)

// Week mode — track Monday of current week
const wStart = ref(getThisWeekMonday())

// Year mode
const yYear = ref(today.getFullYear())

function getThisWeekMonday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const yearStart = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(
    ((d.getTime() - yearStart.getTime()) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7,
  )
  return { year: d.getFullYear(), week }
}

function pad(n: number) { return String(n).padStart(2, '0') }

// ── Period label & navigation ─────────────────────────────────────────────────
const periodLabel = computed(() => {
  if (dimension.value === 'year') return `${yYear.value}年`
  if (dimension.value === 'month') return `${mYear.value}年${mMonth.value}月`
  const { year, week } = getISOWeek(wStart.value)
  return `${year}年第${week}週`
})

const prevPeriod = () => {
  if (dimension.value === 'year') {
    yYear.value--
  }
  else if (dimension.value === 'month') {
    if (mMonth.value === 1) { mYear.value--; mMonth.value = 12 }
    else mMonth.value--
  }
  else {
    const d = new Date(wStart.value)
    d.setDate(d.getDate() - 7)
    wStart.value = d
  }
}

const nextPeriod = () => {
  if (dimension.value === 'year') {
    yYear.value++
  }
  else if (dimension.value === 'month') {
    if (mMonth.value === 12) { mYear.value++; mMonth.value = 1 }
    else mMonth.value++
  }
  else {
    const d = new Date(wStart.value)
    d.setDate(d.getDate() + 7)
    wStart.value = d
  }
}

const setDimension = (d: Dimension) => { dimension.value = d }

const totalLabel = computed(() =>
  ({ week: '本週總支出', month: '本月總支出', year: '本年總支出' }[dimension.value]),
)

// ── Date range for Supabase query ─────────────────────────────────────────────
const dateRange = computed(() => {
  if (dimension.value === 'year') {
    return { from: `${yYear.value}-01-01`, to: `${yYear.value + 1}-01-01` }
  }
  if (dimension.value === 'month') {
    const y = mYear.value, m = mMonth.value
    const ny = m === 12 ? y + 1 : y
    const nm = m === 12 ? 1 : m + 1
    return { from: `${y}-${pad(m)}-01`, to: `${ny}-${pad(nm)}-01` }
  }
  // week
  const from = wStart.value.toISOString().slice(0, 10)
  const end = new Date(wStart.value)
  end.setDate(end.getDate() + 7)
  return { from, to: end.toISOString().slice(0, 10) }
})

// ── Data ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expenses = ref<any[]>([])
const isLoading = ref(false)

const fetchData = async () => {
  isLoading.value = true
  const { from, to } = dateRange.value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('expenses')
    .select('*')
    .gte('created_at', from)
    .lt('created_at', to)
  expenses.value = data ?? []
  isLoading.value = false
}

watch(dateRange, fetchData, { immediate: true })

// ── Derived stats ─────────────────────────────────────────────────────────────
const totalExpense = computed(() =>
  expenses.value.reduce((s, r) => s + r.amount, 0),
)

const totalAmountStr = computed(() =>
  totalExpense.value > 0 ? `-${formatAmount(totalExpense.value)}` : '0',
)

interface CatEntry { cat: string; amount: number; pct: number }

const categoryData = computed<CatEntry[]>(() => {
  const totals: Record<string, number> = {}
  for (const r of expenses.value) {
    totals[r.category] = (totals[r.category] ?? 0) + r.amount
  }
  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({
      cat,
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
})

// ── Trend data ────────────────────────────────────────────────────────────────
const trendData = computed<number[]>(() => {
  if (dimension.value === 'year') {
    const arr = Array(12).fill(0)
    for (const r of expenses.value) {
      arr[new Date(r.created_at).getMonth()] += r.amount
    }
    return arr
  }
  if (dimension.value === 'month') {
    const arr = Array(4).fill(0)
    for (const r of expenses.value) {
      const day = new Date(r.created_at).getDate()
      arr[Math.min(Math.floor((day - 1) / 7), 3)] += r.amount
    }
    return arr
  }
  // week: 0=Mon…6=Sun
  const arr = Array(7).fill(0)
  for (const r of expenses.value) {
    arr[(new Date(r.created_at).getDay() + 6) % 7] += r.amount
  }
  return arr
})

const xLabels = computed(() => {
  if (dimension.value === 'year') return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  if (dimension.value === 'month') return ['週1', '週2', '週3', '週4']
  return ['一', '二', '三', '四', '五', '六', '日']
})

// ── Chart computeds ───────────────────────────────────────────────────────────
const niceMax = computed(() => {
  const max = Math.max(...trendData.value, 1)
  if (max < 1000) return Math.ceil(max / 200) * 200
  if (max < 10000) return Math.ceil(max / 1000) * 1000
  if (max < 100000) return Math.ceil(max / 10000) * 10000
  return Math.ceil(max / 50000) * 50000
})

const yGrid = computed(() => {
  const max = niceMax.value
  return [0, 1, 2, 3, 4].map((i) => {
    const ratio = i / 4
    const val = Math.round(max * (1 - ratio))
    const chartY = SVG_T + ratio * SVG_CH
    return { chartY, label: formatYLabel(val) }
  })
})

const chartPoints = computed(() => {
  const data = trendData.value
  const n = data.length
  const max = niceMax.value
  return data.map((val, i) => ({
    x: SVG_L + (n > 1 ? (i / (n - 1)) * SVG_CW : SVG_CW / 2),
    y: SVG_T + (max > 0 ? (1 - val / max) : 1) * SVG_CH,
    val,
  }))
})

const linePolyStr = computed(() =>
  chartPoints.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
)

const areaPolyStr = computed(() => {
  const pts = chartPoints.value
  if (pts.length === 0) return ''
  const bottom = SVG_T + SVG_CH
  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return `${pts[0].x.toFixed(1)},${bottom} ${line} ${pts[pts.length - 1].x.toFixed(1)},${bottom}`
})

// ── Formatters ────────────────────────────────────────────────────────────────
function formatAmount(n: number) { return n.toLocaleString('zh-TW') }
function formatYLabel(n: number) {
  if (n === 0) return '0'
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return `${n}`
}

// ── Category colours & icons ────────────────────────────────────────────────────
import { catColor, catPath as catPaths } from '~/constants/categories'
</script>

<style scoped>
.analysis-screen {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background-color: #fffaf0;
  background-image:
    radial-gradient(at 10% 20%, rgba(255,245,220,0.8) 0px, transparent 50%),
    radial-gradient(at 90% 10%, rgba(255,230,180,0.7) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(255,190,140,0.6) 0px, transparent 60%),
    radial-gradient(at 20% 80%, rgba(255,210,190,0.5) 0px, transparent 50%),
    radial-gradient(at 80% 90%, rgba(255,160,140,0.4) 0px, transparent 50%),
    linear-gradient(135deg, #fffcf5 0%, #ffe4cc 40%, #ffd1b3 70%, #ffc0a0 100%);
  position: relative;
}

@property --ac1 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 230, 160, 0.6);
}
@property --ac2 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 140, 90, 0.48);
}
@property --ac3 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 190, 130, 0.48);
}

.orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform;
  z-index: 0;
}

.orb-1 {
  width: 360px; height: 360px;
  background: radial-gradient(circle, var(--ac1) 0%, transparent 70%);
  top: -120px; left: -80px;
  animation: aOrbFloat1 16s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite,
             aOrbColor1 11s ease-in-out infinite;
}
.orb-2 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, var(--ac2) 0%, transparent 70%);
  top: 30%; right: -60px;
  animation: aOrbFloat2 20s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite,
             aOrbColor2 15s ease-in-out infinite;
}
.orb-3 {
  width: 340px; height: 340px;
  background: radial-gradient(circle, var(--ac3) 0%, transparent 70%);
  bottom: -80px; left: -40px;
  animation: aOrbFloat3 18s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite,
             aOrbColor3 13s ease-in-out infinite;
}

@keyframes aOrbFloat1 {
  0%   { transform: translate(0,0)         scale(1);    }
  20%  { transform: translate(70px,180px)  scale(1.3);  }
  50%  { transform: translate(120px,460px) scale(1.4);  }
  80%  { transform: translate(-10px,380px) scale(1.1);  }
  100% { transform: translate(0,0)         scale(1);    }
}
@keyframes aOrbFloat2 {
  0%   { transform: translate(0,0)           scale(1);    }
  25%  { transform: translate(-80px,-160px)  scale(0.75); }
  55%  { transform: translate(-60px,300px)   scale(1.35); }
  80%  { transform: translate(-100px,120px)  scale(0.9);  }
  100% { transform: translate(0,0)           scale(1);    }
}
@keyframes aOrbFloat3 {
  0%   { transform: translate(0,0)           scale(1);    }
  30%  { transform: translate(120px,-240px)  scale(1.25); }
  60%  { transform: translate(160px,-500px)  scale(1.38); }
  85%  { transform: translate(50px,-160px)   scale(1.1);  }
  100% { transform: translate(0,0)           scale(1);    }
}
@keyframes aOrbColor1 {
  0%   { --ac1: rgba(255,230,160,0.6);  }
  40%  { --ac1: rgba(255,150,100,0.5);  }
  70%  { --ac1: rgba(255,110,80,0.4);   }
  100% { --ac1: rgba(255,230,160,0.6);  }
}
@keyframes aOrbColor2 {
  0%   { --ac2: rgba(255,140,90,0.48);  }
  40%  { --ac2: rgba(255,220,140,0.52); }
  70%  { --ac2: rgba(255,100,75,0.42);  }
  100% { --ac2: rgba(255,140,90,0.48);  }
}
@keyframes aOrbColor3 {
  0%   { --ac3: rgba(255,190,130,0.48); }
  40%  { --ac3: rgba(255,120,85,0.44);  }
  70%  { --ac3: rgba(255,240,170,0.56); }
  100% { --ac3: rgba(255,190,130,0.48); }
}

/* ── Header ── */
.analysis-header {
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  padding: 24px 24px 0;
}

.dim-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.dim-tab {
  flex: 1;
  text-align: center;
  padding: 8px 20px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.7);
  color: var(--text);
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 300;
}

.dim-tab.active {
  background: var(--accent);
  color: white;
  font-weight: 500;
}

.period-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 16px;
}

.period-arrow {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.15s;
}

.period-arrow:active {
  background: rgba(0,0,0,0.06);
}

.period-arrow svg {
  width: 18px;
  height: 18px;
}

.period-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  letter-spacing: 0.04em;
}

/* ── Body ── */
.analysis-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 24px;
  position: relative;
  z-index: 1;
}

.empty-msg {
  text-align: center;
  font-size: 14px;
  color: var(--text-soft);
  padding: 48px 0;
}

/* ── Card ── */
.stat-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 16px rgba(196, 98, 45, 0.08);
  overflow: hidden;
}

.card-section {
  padding: 16px;
}

.card-divider {
  height: 1px;
  background: var(--border);
  margin: 0 16px;
}

.card-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--text-soft);
}

/* Total */
.total-section {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.total-label {
  font-size: 13px;
  color: #B18272;
}

.total-amount {
  font-size: 28px;
  font-weight: 700;
  color: #8B5E3C;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* Section title */
.section-title {
  font-size: 13px;
  color: var(--text-soft);
  margin-bottom: 12px;
}

/* Category bar */
.cat-bar-wrap {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 14px;
  gap: 2px;
}

.cat-bar-seg {
  min-width: 2px;
}

/* Category rows */
.cat-row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}

.cat-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-icon svg {
  width: 14px;
  height: 14px;
}

.cat-name {
  font-size: 14px;
  color: var(--text);
}

.cat-pct {
  font-size: 12px;
  color: var(--text-soft);
  margin-left: 4px;
}

.cat-amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-align: right;
}

/* Trend chart */
.trend-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* Nav spacer */
.nav-spacer {
  flex-shrink: 0;
  height: calc(72px + env(safe-area-inset-bottom));
}
</style>
