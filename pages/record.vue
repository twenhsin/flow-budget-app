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
      <button class="action-cancel" @click="navigateTo('/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div class="action-main" :class="{ 'voice-active': isListening }">
        <input
          v-if="mode === 'text'"
          class="action-text-input"
          placeholder="輸入你的消費"
          @keydown.enter="handleTextEnter"
        >
        <button v-else class="action-mic-btn" @click="toggleVoice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </button>
      </div>

      <button
        class="action-confirm"
        :class="{ disabled: pendingRecords.length === 0 }"
        @click="confirmRecord"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    </div>

    <EditSheet
      :visible="editVisible"
      :record="editingRecord"
      @close="editVisible = false"
      @save="saveEdit"
    />
  </div>
</template>

<script setup lang="ts">
import type { BudgetRecord, EntryMode } from '~/types'

definePageMeta({ layout: 'bare' })

const route = useRoute()
const { pendingRecords, addRecord, removeRecord, updateRecord, parseTextEntry } = useRecords()

const mode = computed<EntryMode>(() => (route.query.mode as EntryMode) || 'text')
const isListening = ref(false)
const interimTranscript = ref('')
const editVisible = ref(false)
const editingIndex = ref(-1)
const editingRecord = ref<BudgetRecord | null>(null)

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

const openEdit = (index: number) => {
  editingIndex.value = index
  editingRecord.value = { ...pendingRecords.value[index] }
  editVisible.value = true
}

const saveEdit = (record: BudgetRecord) => {
  updateRecord(editingIndex.value, record)
  editVisible.value = false
}

const confirmRecord = () => {
  if (pendingRecords.value.length === 0) return
  stopVoice()
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
  padding: 52px 24px 4px;
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
  padding: 12px 24px calc(20px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-cancel {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s;
}

.action-cancel:active {
  background: rgba(255, 255, 255, 0.95);
}

.action-cancel svg {
  width: 16px;
  height: 16px;
}

.action-main {
  flex: 1;
  height: 46px;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--border);
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}

.action-main.voice-active {
  background: rgba(224, 122, 79, 0.12);
  border-color: rgba(224, 122, 79, 0.4);
}

.action-text-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: var(--text);
  text-align: center;
  outline: none;
  padding: 0 16px;
}

.action-text-input::placeholder {
  color: var(--text-soft);
}

.action-mic-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.action-mic-btn svg {
  width: 20px;
  height: 20px;
}

.voice-active .action-mic-btn {
  color: var(--accent);
  animation: mic-pulse 1.5s ease infinite;
}

.action-confirm {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s;
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
  width: 18px;
  height: 18px;
}
</style>
