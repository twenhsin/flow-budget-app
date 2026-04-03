<template>
  <div class="records-screen">
    <div class="orb orb-1" aria-hidden="true" />
    <div class="orb orb-2" aria-hidden="true" />
    <div class="orb orb-3" aria-hidden="true" />

    <!-- Month Navigation + Summary (fixed top) -->
    <div class="records-header">
      <div class="month-nav">
        <button class="month-arrow" @click="prevMonth">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class="month-label">{{ monthLabel }}</span>
        <button class="month-arrow" @click="nextMonth">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div class="month-summary">
        <span class="summary-label">支出</span>
        <span class="summary-total">-{{ monthTotal }}</span>
      </div>
    </div>

    <!-- Records Body (scrollable middle) -->
    <div class="records-body">
      <ListeningIndicator :visible="isListening" :transcript="interimTranscript" />

      <div v-if="isLoading" class="records-empty">載入中...</div>
      <div v-else-if="dateGroups.length === 0" class="records-empty">本月尚無紀錄</div>

      <template v-else>
        <div v-for="group in dateGroups" :key="group.date" class="date-group">
          <div class="group-header">
            <span class="group-date">{{ group.dateLabel }}</span>
            <span class="group-subtotal">-{{ group.subtotal }}</span>
          </div>
          <div v-for="(record, i) in group.records" :key="record.id ?? i" class="record-row">
            <div class="cat-icon" :style="{ background: catColor(record.category) }">
              <CatIcon :category="record.category" :size="14" :stroke-width="1.8" />
            </div>
            <div class="row-info">
              <span class="row-name">{{ record.name }}</span>
              <span class="row-cat">{{ record.category }}</span>
            </div>
            <span class="row-amount">-{{ record.amount }}</span>
            <button class="row-edit-btn" @click="openEdit(record)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Bottom Input Bar (in-flow, above nav) -->
    <div v-if="quotaRemaining !== null" class="quota-remaining-hint">還剩 {{ quotaRemaining }} 次使用額度</div>
    <div class="input-bar-wrap">
      <div class="input-bar">
        <input
          ref="textInput"
          type="text"
          class="bar-input"
          placeholder="輸入你的消費"
          maxlength="200"
          enterkeyhint="done"
          @keydown.enter="handleTextEnter"
        >
        <button class="bar-add-btn" @click="handleAddClick">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div class="bar-icons">
          <button class="bar-icon-btn" :class="{ active: isListening }" @click="toggleVoice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
          </button>
          <button class="bar-icon-btn" @click="navigateTo('/camera')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Nav spacer (reserves space for fixed BottomNav) -->
    <div class="nav-spacer" />

    <!-- EditSheet -->
    <EditSheet
      :visible="editVisible"
      :record="editingRecord"
      :bottom-offset="72"
      @close="editVisible = false"
      @save="saveEdit"
      @delete="deleteRecord"
    />

    <!-- Saving Overlay -->
    <div v-if="isSaving" class="saving-overlay">
      <div class="saving-spinner" />
    </div>

    <!-- Parse error toast -->
    <div v-if="parseError" class="parse-error-toast">{{ parseError }}</div>
    <QuotaModal v-if="quotaModalReason" :reason="quotaModalReason" @close="quotaModalReason = null" />
  </div>
</template>

<script setup lang="ts">
import type { BudgetRecord } from '~/types'
import { updateGuestExpense, deleteGuestExpense } from '~/composables/useGuestExpenses'

definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { parseTextEntry, parseTextEntryAI } = useRecords()
const { checkQuota, incrementQuota } = useQuota()
const quotaModalReason = ref<'quota' | 'expired' | null>(null)
const quotaRemaining = ref<number | null>(null)

const refreshRemaining = async () => {
  const q = await checkQuota()
  quotaRemaining.value = (q.remaining !== null && q.remaining <= 3) ? q.remaining : null
}

// Month state
const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)

const monthLabel = computed(() => `${year.value}年${month.value}月`)

const prevMonth = () => {
  if (month.value === 1) { year.value--; month.value = 12 }
  else month.value--
}

const nextMonth = () => {
  if (month.value === 12) { year.value++; month.value = 1 }
  else month.value++
}

// Records
const allRecords = ref<BudgetRecord[]>([])
const isLoading = ref(false)
const isSaving = ref(false)

const monthTotal = computed(() => allRecords.value.reduce((s, r) => s + r.amount, 0))

interface DateGroup {
  date: string
  dateLabel: string
  subtotal: number
  records: BudgetRecord[]
}

const dateGroups = computed<DateGroup[]>(() => {
  const groups: Record<string, BudgetRecord[]> = {}
  for (const r of allRecords.value) {
    const d = r.created_at ? r.created_at.slice(0, 10) : 'unknown'
    if (!groups[d]) groups[d] = []
    groups[d].push(r)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, records]) => {
      const d = new Date(date + 'T00:00:00')
      const dateLabel = `${d.getMonth() + 1}月${d.getDate()}日`
      const subtotal = records.reduce((s, r) => s + r.amount, 0)
      return { date, dateLabel, subtotal, records }
    })
})

const fetchRecords = async () => {
  isLoading.value = true
  const from = `${year.value}-${String(month.value).padStart(2, '0')}-01`
  const toMonth = month.value === 12 ? 1 : month.value + 1
  const toYear = month.value === 12 ? year.value + 1 : year.value
  const to = `${toYear}-${String(toMonth).padStart(2, '0')}-01`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('expenses')
    .select('*')
    .gte('created_at', from)
    .lt('created_at', to)
    .order('created_at', { ascending: false })

  q = user.value ? q.eq('user_id', user.value.id) : q.is('user_id', null)

  const { data } = await q
  allRecords.value = data ?? []
  isLoading.value = false
}

watch([year, month], fetchRecords, { immediate: true })

// Category icons
import { catColor as catColorBuiltin } from '~/constants/categories'
const { getCatColor, load: loadCategories } = useUserCategories()
const catColor = (name: string) => getCatColor(name) ?? catColorBuiltin(name)

onMounted(async () => {
  await loadCategories()
  await refreshRemaining()
})

// Edit
const editVisible = ref(false)
const editingRecord = ref<BudgetRecord | null>(null)

const openEdit = (record: BudgetRecord) => {
  editingRecord.value = { ...record }
  editVisible.value = true
}

const saveEdit = async (record: BudgetRecord) => {
  if (!record.id) return
  editVisible.value = false
  isSaving.value = true
  if (!user.value) {
    updateGuestExpense(record.id, { name: record.name, amount: record.amount, category: record.category })
  }
  else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('expenses').update({
      name: record.name,
      amount: record.amount,
      category: record.category,
    }).eq('id', record.id)
  }
  isSaving.value = false
  await fetchRecords()
}

const deleteRecord = async () => {
  if (!editingRecord.value?.id) return
  editVisible.value = false
  isSaving.value = true
  if (!user.value) {
    deleteGuestExpense(editingRecord.value.id)
  }
  else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('expenses').delete().eq('id', editingRecord.value.id)
  }
  isSaving.value = false
  await fetchRecords()
}

// Text input
const textInput = ref<HTMLInputElement | null>(null)
const parseError = ref('')

const saveNewRecord = async (record: BudgetRecord) => {
  isSaving.value = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('expenses').insert([{
    name: record.name,
    amount: record.amount,
    category: record.category,
    input_method: 'text',
    user_id: user.value?.id ?? null,
  }])
  isSaving.value = false
  await fetchRecords()
}

const handleParseError = (e: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((e as any)?.data?.message === 'off_topic') {
    parseError.value = '請輸入消費紀錄，例如：午餐100元'
    setTimeout(() => { parseError.value = '' }, 4000)
    return true
  }
  return false
}

const handleTextEnter = async (e: KeyboardEvent) => {
  const input = e.target as HTMLInputElement
  const val = input.value.trim()
  if (!val) return
  const quota = await checkQuota()
  if (!quota.allowed) {
    quotaModalReason.value = quota.reason
    return
  }
  input.value = ''
  try {
    await saveNewRecord(await parseTextEntryAI(val))
    await incrementQuota()
    await refreshRemaining()
  }
  catch (err: unknown) {
    if (!handleParseError(err)) await saveNewRecord(parseTextEntry(val))
  }
}

const handleAddClick = async () => {
  const input = textInput.value
  if (!input) return
  const val = input.value.trim()
  if (!val) return
  const quota = await checkQuota()
  if (!quota.allowed) {
    quotaModalReason.value = quota.reason
    return
  }
  input.value = ''
  try {
    await saveNewRecord(await parseTextEntryAI(val))
    await incrementQuota()
    await refreshRemaining()
  }
  catch (err: unknown) {
    if (!handleParseError(err)) await saveNewRecord(parseTextEntry(val))
  }
}

// Voice
const { isListening, interimTranscript, toggleVoice } = useVoiceInput({
  onFinal: async (text) => {
    const quota = await checkQuota()
    if (!quota.allowed) {
      quotaModalReason.value = quota.reason
      return
    }
    try {
      await saveNewRecord(await parseTextEntryAI(text))
      await incrementQuota()
      await refreshRemaining()
    }
    catch { await saveNewRecord(parseTextEntry(text)) }
  },
})
</script>

<style scoped>
.quota-remaining-hint {
  font-size: 12px;
  color: var(--accent);
  text-align: center;
  padding: 4px 0;
}

.records-screen {
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

@property --rc1 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 230, 160, 0.6);
}

@property --rc2 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 140, 90, 0.48);
}

@property --rc3 {
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
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, var(--rc1) 0%, transparent 70%);
  top: -120px;
  left: -80px;
  animation:
    rOrbFloat1 16s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite,
    rOrbColor1 11s ease-in-out infinite;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--rc2) 0%, transparent 70%);
  top: 30%;
  right: -60px;
  animation:
    rOrbFloat2 20s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite,
    rOrbColor2 15s ease-in-out infinite;
}

.orb-3 {
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, var(--rc3) 0%, transparent 70%);
  bottom: -80px;
  left: -40px;
  animation:
    rOrbFloat3 18s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite,
    rOrbColor3 13s ease-in-out infinite;
}

@keyframes rOrbFloat1 {
  0%   { transform: translate(0, 0)         scale(1); }
  18%  { transform: translate(80px, 160px)  scale(1.3); }
  35%  { transform: translate(30px, 340px)  scale(0.8); }
  52%  { transform: translate(140px, 500px) scale(1.4); }
  70%  { transform: translate(60px, 620px)  scale(0.75); }
  85%  { transform: translate(-20px, 420px) scale(1.15); }
  100% { transform: translate(0, 0)         scale(1); }
}

@keyframes rOrbFloat2 {
  0%   { transform: translate(0, 0)           scale(1); }
  15%  { transform: translate(-60px, -180px)  scale(0.7); }
  32%  { transform: translate(-130px, 80px)   scale(1.35); }
  50%  { transform: translate(-50px, 320px)   scale(0.85); }
  67%  { transform: translate(-160px, 180px)  scale(1.4); }
  82%  { transform: translate(-80px, -100px)  scale(0.9); }
  100% { transform: translate(0, 0)           scale(1); }
}

@keyframes rOrbFloat3 {
  0%   { transform: translate(0, 0)           scale(1); }
  20%  { transform: translate(100px, -200px)  scale(1.25); }
  38%  { transform: translate(60px, -420px)   scale(0.72); }
  55%  { transform: translate(180px, -560px)  scale(1.38); }
  72%  { transform: translate(90px, -320px)   scale(0.8); }
  88%  { transform: translate(40px, -140px)   scale(1.2); }
  100% { transform: translate(0, 0)           scale(1); }
}

@keyframes rOrbColor1 {
  0%   { --rc1: rgba(255, 230, 160, 0.6); }
  28%  { --rc1: rgba(255, 150, 100, 0.5); }
  55%  { --rc1: rgba(255, 190, 150, 0.55); }
  78%  { --rc1: rgba(255, 110, 80, 0.4); }
  100% { --rc1: rgba(255, 230, 160, 0.6); }
}

@keyframes rOrbColor2 {
  0%   { --rc2: rgba(255, 140, 90, 0.48); }
  25%  { --rc2: rgba(255, 220, 140, 0.52); }
  52%  { --rc2: rgba(255, 100, 75, 0.42); }
  75%  { --rc2: rgba(255, 185, 120, 0.5); }
  100% { --rc2: rgba(255, 140, 90, 0.48); }
}

@keyframes rOrbColor3 {
  0%   { --rc3: rgba(255, 190, 130, 0.48); }
  30%  { --rc3: rgba(255, 120, 85, 0.44); }
  58%  { --rc3: rgba(255, 240, 170, 0.56); }
  82%  { --rc3: rgba(255, 160, 110, 0.5); }
  100% { --rc3: rgba(255, 190, 130, 0.48); }
}

/* Header (month nav + summary) */
.records-header {
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

/* Month Navigation */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 8px 0;
}

.month-arrow {
  width: 44px;
  height: 44px;
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

.month-arrow:active {
  background: rgba(0, 0, 0, 0.06);
}

.month-arrow svg {
  width: 20px;
  height: 20px;
}

.month-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
  letter-spacing: 0.04em;
}

/* Month Summary */
.month-summary {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 4px 24px 16px;
}

.summary-label {
  font-size: 12px;
  color: var(--text-soft);
}

.summary-total {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* Records Body (scrollable) */
.records-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 24px;
  position: relative;
  z-index: 1;
}

.records-empty {
  padding: 48px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--text-soft);
}

/* Date Group */
.date-group {
  background: var(--surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: var(--shadow-card);
  animation: rowIn 0.25s ease both;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
}

.group-date {
  font-size: 12px;
  color: var(--text-soft);
}

.group-subtotal {
  font-size: 12px;
  color: var(--text-soft);
  font-variant-numeric: tabular-nums;
}

/* Record Row */
.record-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 10px 14px;
  border-bottom: 1px solid var(--border);
}

.record-row:last-child {
  border-bottom: none;
}

.cat-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.row-name {
  font-size: 14px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-cat {
  font-size: 12px;
  color: var(--text-soft);
}

.row-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.row-edit-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  transition: color 0.15s;
}

.row-edit-btn:active {
  color: var(--text);
}

.row-edit-btn svg {
  width: 20px;
  height: 20px;
}

/* Input Bar (in-flow, flex-shrink:0) */
.input-bar-wrap {
  flex-shrink: 0;
  padding: 8px 16px 24px;
  position: relative;
  z-index: 1;
}

.input-bar {
  display: flex;
  align-items: center;
  background: var(--surface);
  border-radius: var(--radius-pill);
  padding: 4px 4px 4px 20px;
  box-shadow: var(--shadow-sm);
}

.bar-input {
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

.bar-input::placeholder {
  color: var(--text-soft);
}

.bar-add-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s;
}

.bar-add-btn:active {
  transform: scale(0.88);
}

.bar-add-btn svg {
  width: 20px;
  height: 20px;
}

.bar-icons {
  display: flex;
  align-items: center;
  border: 1px solid rgba(224, 122, 79, 0.4);
  border-radius: var(--radius-pill);
  padding: 2px;
  flex-shrink: 0;
}

.bar-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s;
  flex-shrink: 0;
}

.bar-icon-btn:active {
  transform: scale(0.88);
}

.bar-icon-btn.active {
  color: var(--text);
  animation: mic-pulse 1.5s ease infinite;
}

.bar-icon-btn svg {
  width: 20px;
  height: 20px;
}

/* Nav spacer (reserves height for fixed BottomNav) */
.nav-spacer {
  flex-shrink: 0;
  height: calc(72px + env(safe-area-inset-bottom));
}

/* Saving */
.saving-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.saving-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-accent);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.parse-error-toast {
  position: fixed;
  bottom: calc(88px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: var(--error-bg);
  color: white;
  font-size: 12px;
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
}
</style>
