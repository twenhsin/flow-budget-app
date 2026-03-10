<template>
  <div class="home-screen">
    <div class="orb orb-1" aria-hidden="true" />
    <div class="orb orb-2" aria-hidden="true" />
    <div class="orb orb-3" aria-hidden="true" />
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

      <div class="input-bar">
        <input
          ref="textInput"
          v-model="inputValue"
          type="text"
          :placeholder="currentPlaceholder"
          enterkeyhint="done"
          @keydown.enter="handleSubmit"
        >
        <button class="add-btn" :disabled="!inputValue.trim()" @click="handleSubmit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div class="input-icons">
          <button class="icon-btn" :class="{ active: isListening }" title="語音" @click.stop="toggleVoice">
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
  </div>
</template>

<script setup lang="ts">
import type { HomeTab } from '~/types'

definePageMeta({ layout: 'default' })

const { clearRecords, addRecord, parseTextEntry } = useRecords()

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

const handleSubmit = () => {
  const val = inputValue.value.trim()
  if (!val) return
  stopVoice()
  inputValue.value = ''
  if (activeTab.value === 'record') {
    clearRecords()
    addRecord(parseTextEntry(val))
    navigateTo('/record?mode=confirm')
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
.home-screen {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #fffaf0;
  background-image:
    radial-gradient(at 10% 20%, rgba(255,245,220,0.8) 0px, transparent 50%),
    radial-gradient(at 90% 10%, rgba(255,230,180,0.7) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(255,190,140,0.6) 0px, transparent 60%),
    radial-gradient(at 20% 80%, rgba(255,210,190,0.5) 0px, transparent 50%),
    radial-gradient(at 80% 90%, rgba(255,160,140,0.4) 0px, transparent 50%),
    linear-gradient(135deg, #fffcf5 0%, #ffe4cc 40%, #ffd1b3 70%, #ffc0a0 100%);
}

@property --c1 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 230, 160, 0.6);
}

@property --c2 {
  syntax: '<color>';
  inherits: false;
  initial-value: rgba(255, 140, 90, 0.48);
}

@property --c3 {
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

.home-header,
.home-headline,
.home-hero {
  position: relative;
  z-index: 1;
}

.orb-1 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, var(--c1) 0%, transparent 70%);
  top: -120px;
  left: -80px;
  animation:
    orbFloat1  16s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite,
    orbColor1  11s ease-in-out infinite;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--c2) 0%, transparent 70%);
  top: 30%;
  right: -60px;
  animation:
    orbFloat2  20s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite,
    orbColor2  15s ease-in-out infinite;
}

.orb-3 {
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, var(--c3) 0%, transparent 70%);
  bottom: -80px;
  left: -40px;
  animation:
    orbFloat3  18s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite,
    orbColor3  13s ease-in-out infinite;
}

/* ── position + scale paths ── */
@keyframes orbFloat1 {
  0%   { transform: translate(0, 0)         scale(1); }
  18%  { transform: translate(80px, 160px)  scale(1.3); }
  35%  { transform: translate(30px, 340px)  scale(0.8); }
  52%  { transform: translate(140px, 500px) scale(1.4); }
  70%  { transform: translate(60px, 620px)  scale(0.75); }
  85%  { transform: translate(-20px, 420px) scale(1.15); }
  100% { transform: translate(0, 0)         scale(1); }
}

@keyframes orbFloat2 {
  0%   { transform: translate(0, 0)           scale(1); }
  15%  { transform: translate(-60px, -180px)  scale(0.7); }
  32%  { transform: translate(-130px, 80px)   scale(1.35); }
  50%  { transform: translate(-50px, 320px)   scale(0.85); }
  67%  { transform: translate(-160px, 180px)  scale(1.4); }
  82%  { transform: translate(-80px, -100px)  scale(0.9); }
  100% { transform: translate(0, 0)           scale(1); }
}

@keyframes orbFloat3 {
  0%   { transform: translate(0, 0)           scale(1); }
  20%  { transform: translate(100px, -200px)  scale(1.25); }
  38%  { transform: translate(60px, -420px)   scale(0.72); }
  55%  { transform: translate(180px, -560px)  scale(1.38); }
  72%  { transform: translate(90px, -320px)   scale(0.8); }
  88%  { transform: translate(40px, -140px)   scale(1.2); }
  100% { transform: translate(0, 0)           scale(1); }
}

/* ── colour cycles (different durations → always out of phase) ── */
@keyframes orbColor1 {
  0%   { --c1: rgba(255, 230, 160, 0.6); }
  28%  { --c1: rgba(255, 150, 100, 0.5); }
  55%  { --c1: rgba(255, 190, 150, 0.55); }
  78%  { --c1: rgba(255, 110, 80, 0.4); }
  100% { --c1: rgba(255, 230, 160, 0.6); }
}

@keyframes orbColor2 {
  0%   { --c2: rgba(255, 140, 90, 0.48); }
  25%  { --c2: rgba(255, 220, 140, 0.52); }
  52%  { --c2: rgba(255, 100, 75, 0.42); }
  75%  { --c2: rgba(255, 185, 120, 0.5); }
  100% { --c2: rgba(255, 140, 90, 0.48); }
}

@keyframes orbColor3 {
  0%   { --c3: rgba(255, 190, 130, 0.48); }
  30%  { --c3: rgba(255, 120, 85, 0.44); }
  58%  { --c3: rgba(255, 240, 170, 0.56); }
  82%  { --c3: rgba(255, 160, 110, 0.5); }
  100% { --c3: rgba(255, 190, 130, 0.48); }
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
  background: rgba(255, 255, 255, 0.7);
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
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-pill);
  padding: 4px 4px 4px 20px;
  box-shadow: 0 2px 16px rgba(196, 98, 45, 0.1);
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
  color: #EC844C;
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
  border-radius: 40px;
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
  color: #EC844C;
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
</style>
