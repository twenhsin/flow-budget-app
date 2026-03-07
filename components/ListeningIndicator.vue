<template>
  <Transition name="fade">
    <div v-if="visible" class="listening-indicator">
      <div class="listen-dots">
        <div class="listen-dot" />
        <div class="listen-dot" />
        <div class="listen-dot" />
      </div>
      <span class="listen-text">{{ transcript || '我正在聆聽' }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean; transcript?: string }>()
</script>

<style scoped>
.listening-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(224, 122, 79, 0.08);
  border-radius: var(--radius-md);
}

.listen-dots {
  display: flex;
  gap: 4px;
}

.listen-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  animation: bounce 1.2s ease infinite;
}

.listen-dot:nth-child(2) { animation-delay: 0.2s; }
.listen-dot:nth-child(3) { animation-delay: 0.4s; }

.listen-text {
  font-size: 13px;
  color: var(--accent);
  font-weight: 300;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
