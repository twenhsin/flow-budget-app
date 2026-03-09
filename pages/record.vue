<template>
  <div class="record-screen">
    <div class="record-header">
      <div class="record-title">當前紀錄</div>
      <div class="record-date">{{ formattedDate }}</div>
    </div>

    <div class="record-body">
      <ListeningIndicator :visible="isListening" :transcript="interimTranscript" />
      <RecordTable
        :records="pendingRecords"
        @edit="openEdit"
        @delete="removeRecord"
      />
    </div>

    <div class="action-bar">
      <div class="action-pill" :class="{ 'action-pill--full': mode === 'text' }">
        <button class="action-side-btn" @click="navigateTo('/')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button
          v-if="mode === 'voice'"
          class="action-center-btn"
          :class="{ active: isListening }"
          @click="toggleVoice"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </button>
        <button v-else-if="mode === 'camera'" class="action-center-btn" @click="navigateTo('/camera')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <div v-else class="action-center-input">
          <input
            ref="textInput"
            class="action-text-input"
            placeholder="輸入你的消費"
            enterkeyhint="done"
            @keydown.enter="handleTextEnter"
          >
          <button class="text-add-btn" @click="handleTextAdd">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <button
          class="action-side-btn action-confirm"
          :class="{ disabled: pendingRecords.length === 0 }"
          @click="confirmRecord"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>

    <EditSheet
      :visible="editVisible"
      :record="editingRecord"
      @close="editVisible = false"
      @save="saveEdit"
    />

    <!-- 儲存中 overlay -->
    <div v-if="isSaving" class="saving-overlay">
      <div class="saving-spinner" />
    </div>

    <!-- 錯誤 toast -->
    <div v-if="saveError" class="save-error-toast">{{ saveError }}</div>
  </div>
</template>

<script setup lang="ts">
import type { BudgetRecord, EntryMode } from '~/types'

definePageMeta({ layout: 'bare' })

const route = useRoute()
const supabase = useSupabaseClient()
const { pendingRecords, addRecord, removeRecord, updateRecord, parseTextEntry } = useRecords()
const hasNotification = useState('hasNotification', () => false)

const mode = computed<EntryMode>(() => (route.query.mode as EntryMode) || 'text')
const textInput = ref<HTMLInputElement | null>(null)
const isListening = ref(false)
const interimTranscript = ref('')
const editVisible = ref(false)
const editingIndex = ref(-1)
const editingRecord = ref<BudgetRecord | null>(null)
const isSaving = ref(false)
const saveError = ref('')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognition: any = null
let silenceTimer: ReturnType<typeof setTimeout> | null = null

const formattedDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

onMounted(() => {
  if (mode.value === 'voice') startVoice()
})

onUnmounted(() => stopVoice())

const resetSilenceTimer = () => {
  if (silenceTimer) clearTimeout(silenceTimer)
  silenceTimer = setTimeout(() => stopVoice(), 5000)
}

const startVoice = () => {
  if (import.meta.server) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) {
    console.warn('此瀏覽器不支援 Web Speech API')
    return
  }

  recognition = new SR()
  recognition.lang = 'zh-TW'
  recognition.continuous = true
  recognition.interimResults = true

  recognition.onresult = (event: any) => {
    resetSilenceTimer()
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) {
        const text = result[0].transcript.trim()
        interimTranscript.value = ''
        if (text) addRecord(parseTextEntry(text))
      }
      else {
        interimTranscript.value = result[0].transcript
      }
    }
  }

  recognition.onerror = (event: any) => {
    if (event.error !== 'no-speech') stopVoice()
  }

  // continuous mode may stop unexpectedly on some browsers — restart if still active
  recognition.onend = () => {
    if (isListening.value) recognition?.start()
  }

  isListening.value = true
  interimTranscript.value = ''
  recognition.start()
  resetSilenceTimer()
}

const stopVoice = () => {
  isListening.value = false
  interimTranscript.value = ''
  if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
  try { recognition?.stop() } catch {}
  recognition = null
}

const toggleVoice = () => {
  if (isListening.value) stopVoice()
  else startVoice()
}

const handleTextEnter = (e: KeyboardEvent) => {
  const input = e.target as HTMLInputElement
  const val = input.value.trim()
  if (!val) return
  addRecord(parseTextEntry(val))
  input.value = ''
}

const handleTextAdd = () => {
  const input = textInput.value
  if (!input) return
  const val = input.value.trim()
  if (!val) return
  addRecord(parseTextEntry(val))
  input.value = ''
  input.focus()
}

const openEdit = (index: number) => {
  editingIndex.value = index
  editingRecord.value = { ...pendingRecords.value[index] }
  editVisible.value = true
}

const saveEdit = (record: BudgetRecord) => {
  updateRecord(editingIndex.value, record)
  editVisible.value = false
}

const confirmRecord = async () => {
  if (pendingRecords.value.length === 0) return
  stopVoice()

  isSaving.value = true
  saveError.value = ''

  const rows = pendingRecords.value.map(r => ({
    name: r.name,
    amount: r.amount,
    category: r.category,
    input_method: mode.value,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('expenses').insert(rows)

  isSaving.value = false

  if (error) {
    saveError.value = `儲存失敗：${error.message}`
    setTimeout(() => { saveError.value = '' }, 5000)
    return
  }

  hasNotification.value = true
  navigateTo('/complete')
}
</script>

<style scoped>
.record-screen {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: linear-gradient(160deg, #FDF0E6 0%, #FBDFC8 55%, #F5C8A8 100%);
  position: relative;
}

.record-header {
  padding: 40px 24px 4px;
}

.record-title {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 24px;
  font-weight: 300;
  margin-bottom: 4px;
}

.record-date {
  font-size: 12px;
  color: var(--text-soft);
}

.record-body {
  flex: 1;
  padding: 20px 24px 16px;
  overflow-y: auto;
}

.action-bar {
  padding: 12px 24px calc(28px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 40px;
  padding: 8px;
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 20px rgba(196, 98, 45, 0.1);
}

.action-side-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s;
}

.action-side-btn svg {
  width: 16px;
  height: 16px;
}

.action-side-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

.action-center-btn {
  width: 60px;
  height: 44px;
  border-radius: 22px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.action-center-btn svg {
  width: 20px;
  height: 20px;
}

.action-center-btn.active {
  background: rgba(224, 122, 79, 0.15);
  color: var(--accent);
  animation: mic-pulse 1.5s ease infinite;
}

.action-center-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.action-center-input {
  flex: 1;
  min-width: 0;
  height: 44px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.action-text-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 300;
  color: var(--text);
  text-align: center;
  outline: none;
  padding: 0 16px;
}

.text-add-btn {
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
  margin-right: 4px;
  transition: all 0.18s;
}

.text-add-btn:active {
  transform: scale(0.88);
}

.text-add-btn svg {
  width: 18px;
  height: 18px;
}

.action-text-input::placeholder {
  color: var(--text-soft);
}

.action-confirm {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 12px rgba(224, 122, 79, 0.35);
}

.action-confirm:active {
  transform: scale(0.92);
}

.action-confirm.disabled {
  background: var(--disabled);
  box-shadow: none;
  pointer-events: none;
}

.action-confirm svg {
  width: 16px;
  height: 16px;
}

.action-pill--full {
  width: 100%;
}

.saving-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.saving-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(224, 122, 79, 0.25);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.save-error-toast {
  position: fixed;
  bottom: calc(120px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  background: rgba(200, 60, 60, 0.9);
  color: white;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 20px;
  white-space: nowrap;
  z-index: 20;
}
</style>
