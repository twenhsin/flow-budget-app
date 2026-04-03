<template>
  <div class="home-screen">
    <div class="home-header">讓 AI 幫你整理每一筆消費</div>
    <Transition name="fade" mode="out-in">
      <h1 :key="activeTab" class="home-headline" v-html="currentHeadline" />
    </Transition>
    <div class="home-hero">
      <div class="mode-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="mode-tab"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <ListeningIndicator :visible="isListening" :transcript="interimTranscript" />

      <div v-if="quotaRemaining !== null" class="quota-remaining-hint">還剩 {{ quotaRemaining }} 次使用額度</div>
      <div class="input-bar">
        <input
          ref="textInput"
          v-model="inputValue"
          type="text"
          maxlength="200"
          :placeholder="isQuerying ? 'AI 分析中...' : currentPlaceholder"
          :disabled="isQuerying"
          enterkeyhint="done"
          @keydown.enter="handleSubmit"
        >
        <button class="add-btn" :disabled="!inputValue.trim() || isQuerying" @click="handleSubmit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div class="input-icons">
          <button class="icon-btn" :class="{ active: isListening }" :disabled="isQuerying" title="語音" @click.stop="toggleVoice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
          </button>
          <button v-if="activeTab === 'record'" class="icon-btn" title="拍照" @click.stop="goCamera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div v-if="queryError" class="query-error-toast">{{ queryError }}</div>
    <QuotaModal v-if="quotaModalReason" :reason="quotaModalReason" @close="quotaModalReason = null" />
  </div>
</template>

<script setup lang="ts">
import type { HomeTab } from '~/types'
import { getGuestExpenses } from '~/composables/useGuestExpenses'

definePageMeta({ layout: 'default' })

const user = useSupabaseUser()
const { clearRecords, addRecord, parseTextEntry, parseTextEntryAI } = useRecords()
const { categories } = useUserCategories()
const { checkQuota, incrementQuota } = useQuota()
const quotaModalReason = ref<'quota' | 'expired' | null>(null)
const quotaRemaining = ref<number | null>(null)

const refreshRemaining = async () => {
  const q = await checkQuota()
  quotaRemaining.value = (q.remaining !== null && q.remaining <= 3) ? q.remaining : null
}

onMounted(refreshRemaining)

// Tabs
const activeTab = ref<HomeTab>('record')
const tabs = [
  { value: 'record' as HomeTab, label: '紀錄' },
  { value: 'query' as HomeTab, label: '查詢' },
]

const headlines: Record<HomeTab, string> = {
  record: '記下每一筆，<br>建立你的<br>消費全貌',
  query: '輸入條件，<br>算出你想知道<br>的每一個數字',
}

const placeholders: Record<HomeTab, string> = {
  record: '輸入你的消費',
  query: '輸入查詢條件',
}

const currentHeadline = computed(() => headlines[activeTab.value])
const currentPlaceholder = computed(() => placeholders[activeTab.value])

// Input
const textInput = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const isQuerying = ref(false)
const queryError = ref('')

interface QueryResult {
  title: string
  queryType: 'total' | 'list' | 'ranking' | 'monthly' | 'grouped'
  total: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groups: any[]
  dateFrom: string
  dateTo: string
}
const queryResult = useState<QueryResult | null>('queryResult', () => null)

const handleSubmit = async () => {
  const val = inputValue.value.trim()
  if (!val || isQuerying.value) return
  stopVoice()

  const quota = await checkQuota()
  if (!quota.allowed) {
    quotaModalReason.value = quota.reason
    return
  }

  if (activeTab.value === 'record') {
    inputValue.value = ''
    clearRecords()
    try {
      addRecord(await parseTextEntryAI(val))
      await incrementQuota()
      await refreshRemaining()
    }
    catch (e: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((e as any)?.data?.message === 'off_topic') {
        queryError.value = '請輸入消費紀錄，例如：午餐100元'
        setTimeout(() => { queryError.value = '' }, 4000)
        return
      }
      addRecord(parseTextEntry(val))
    }
    navigateTo('/record?mode=confirm')
    return
  }

  // query tab
  inputValue.value = ''
  isQuerying.value = true
  queryError.value = ''
  try {
    const body: Record<string, unknown> = {
      question: val,
      userCategories: categories.value.map(c => c.name),
    }
    if (!user.value) body.guestExpenses = getGuestExpenses()
    const data = await $fetch<QueryResult>('/api/query-expenses', {
      method: 'POST',
      body,
    })
    queryResult.value = data
    await incrementQuota()
    navigateTo('/query-result')
  }
  catch (e: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryError.value = (e as any)?.data?.message === 'off_topic'
      ? '請輸入消費相關查詢，例如：本月餐費多少'
      : '查詢失敗，請重試'
    setTimeout(() => { queryError.value = '' }, 4000)
  }
  finally {
    isQuerying.value = false
  }
}

// Voice
const { isListening, interimTranscript, stopVoice, toggleVoice } = useVoiceInput({
  onFinal: (text) => { inputValue.value = text },
  onInterim: (text) => { inputValue.value = text },
})

// Camera
const goCamera = () => {
  clearRecords()
  navigateTo('/camera')
}


</script>

<style scoped>
.quota-remaining-hint {
  font-size: 12px;
  color: var(--accent);
  text-align: center;
  margin-bottom: 6px;
}

.home-screen {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  overflow: hidden;
}

.home-header,
.home-headline,
.home-hero {
  position: relative;
  z-index: 1;
}

.home-header {
  padding: 52px 24px 0;
  font-size: 16px;
  color: var(--text-soft);
  letter-spacing: 0.05em;
}

.home-headline {
  font-family: 'Chivo Mono', monospace;
  font-size: 42px;
  font-weight: 300;
  line-height: 1.6;
  color: var(--text);
  padding: 0 24px;
  margin-top: 48px;
}

.home-hero {
  flex: 1;
  padding: 20px 24px 32px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.mode-tab {
  padding: 9px 20px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface);
  color: var(--text);
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 300;
}

.mode-tab.active {
  background: var(--accent);
  color: white;
  font-weight: 500;
}

.input-bar {
  display: flex;
  align-items: center;
  background: var(--surface);
  border-radius: var(--radius-pill);
  padding: 4px 4px 4px 20px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.input-bar input {
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

.input-bar input::placeholder {
  color: var(--text-soft);
}

/* + submit button */
.add-btn {
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

.add-btn:active {
  transform: scale(0.88);
}

.add-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.add-btn svg {
  width: 20px;
  height: 20px;
}

.input-icons {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
  border: 1px solid rgba(224, 122, 79, 0.4);
  border-radius: var(--radius-pill);
  padding: 2px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--accent);
  transition: all 0.18s;
  flex-shrink: 0;
}

.icon-btn:active {
  transform: scale(0.88);
}

.icon-btn.active {
  color: var(--text);
  animation: mic-pulse 1.5s ease infinite;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.icon-btn:first-child {
  padding-left: 4px;
}

.icon-btn:last-child {
  padding-right: 4px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.query-error-toast {
  position: fixed;
  bottom: calc(100px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: var(--error-bg);
  color: white;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  white-space: nowrap;
  z-index: 20;
}
</style>
