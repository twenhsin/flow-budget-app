<template>
  <div class="complete-screen">
    <div class="complete-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    </div>
    <div class="complete-text">完成{{ pendingRecords.length }}筆紀錄</div>
    <div class="complete-sub">{{ summary }}</div>
    <div class="complete-timer">
      <div class="complete-timer-bar" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'bare' })

const { pendingRecords, clearRecords } = useRecords()
const hasNotification = useState('hasNotification', () => false)

const summary = computed(() =>
  pendingRecords.value.map(r => `${r.name} $${r.amount}`).join('・'),
)

onMounted(() => {
  hasNotification.value = true
  setTimeout(() => {
    clearRecords()
    navigateTo('/')
  }, 3000)
})
</script>

<style scoped>
.complete-screen {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: linear-gradient(160deg, #FDF0E6 0%, #FBDFC8 55%, #F5C8A8 100%);
  align-items: center;
  justify-content: center;
}

.complete-icon svg {
  width: 72px;
  height: 72px;
  color: var(--accent);
  animation: check-draw 0.5s ease both;
}

.complete-text {
  font-family: 'Noto Serif TC', serif;
  font-size: 18px;
  font-weight: 300;
  color: var(--text);
  margin: 20px 0 8px;
}

.complete-sub {
  font-size: 13px;
  color: var(--text-soft);
}

.complete-timer {
  margin-top: 32px;
  width: 40px;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.complete-timer-bar {
  height: 100%;
  background: var(--accent);
  width: 100%;
  animation: timer-shrink 3s linear forwards;
}
</style>
