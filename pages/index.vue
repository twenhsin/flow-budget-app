<template>
  <div class="home-screen">
    <div class="home-header">讓 AI 幫你整理每一筆消費</div>
    <h1 class="home-headline">紀錄，<br>分析，<br>掌握消費</h1>
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

      <div class="input-bar">
        <input
          type="text"
          placeholder="輸入你的消費"
          readonly
          @click="goTextRecord"
        >
        <button class="icon-btn" title="語音" @click="goVoiceRecord">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </button>
        <button class="icon-btn" title="拍照" @click="goCamera">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HomeTab } from '~/types'

definePageMeta({ layout: 'default' })

const { clearRecords } = useRecords()

const activeTab = ref<HomeTab>('record')
const tabs = [
  { value: 'record' as HomeTab, label: '紀錄' },
  { value: 'total' as HomeTab, label: '總計' },
  { value: 'analysis' as HomeTab, label: '分析' },
]

const goTextRecord = () => {
  clearRecords()
  navigateTo('/record?mode=text')
}

const goVoiceRecord = () => {
  clearRecords()
  navigateTo('/record?mode=voice')
}

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
  background-color: #fffaf0;
  background-image:
    radial-gradient(at 10% 20%, rgba(255,245,220,0.8) 0px, transparent 50%),
    radial-gradient(at 90% 10%, rgba(255,230,180,0.7) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(255,190,140,0.6) 0px, transparent 60%),
    radial-gradient(at 20% 80%, rgba(255,210,190,0.5) 0px, transparent 50%),
    radial-gradient(at 80% 90%, rgba(255,160,140,0.4) 0px, transparent 50%),
    linear-gradient(135deg, #fffcf5 0%, #ffe4cc 40%, #ffd1b3 70%, #ffc0a0 100%);
}

.home-header {
  padding: 52px 24px 0;
  font-size: 12px;
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
}

.input-bar {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-pill);
  padding: 8px 12px 8px 20px;
  gap: 8px;
  box-shadow: 0 2px 16px rgba(196, 98, 45, 0.1);
}

.input-bar input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 300;
  color: var(--text);
  outline: none;
  cursor: pointer;
}

.input-bar input::placeholder {
  color: var(--text-soft);
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
  color: var(--text-soft);
  transition: all 0.18s;
  flex-shrink: 0;
}

.icon-btn:active {
  transform: scale(0.88);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}
</style>
