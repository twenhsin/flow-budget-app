<template>
  <div
    class="quota-modal-overlay"
    style="background: rgba(0, 0, 0, 0.4);"
    @click.self="$emit('close')"
  >
    <div class="quota-modal-card">
      <div class="quota-modal-title">{{ title }}</div>
      <div class="quota-modal-desc">{{ desc }}</div>
      <div class="quota-modal-actions">
        <button class="quota-btn quota-btn-outline" @click="$emit('close')">關閉</button>
        <button class="quota-btn quota-btn-solid" @click="contact">與我聯繫</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ reason: 'quota' | 'expired' }>()
defineEmits(['close'])

const title = computed(() =>
  props.reason === 'expired' ? 'Demo 使用期限已到' : 'Demo 額度已用完',
)

const desc = computed(() =>
  props.reason === 'expired'
    ? 'Demo 使用期限為 30 天，如需繼續使用歡迎與我聯繫'
    : '今日 10 次 Demo 額度已用完，如需繼續使用歡迎與我聯繫',
)

const contact = () => {
  window.location.href = 'mailto:wenhsin600@gmail.com?subject=Filo Demo 使用申請'
}
</script>

<style scoped>
.quota-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.quota-modal-card {
  width: 100%;
  max-width: 320px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.quota-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.quota-modal-desc {
  font-size: 14px;
  color: var(--text-soft);
  line-height: 1.6;
}

.quota-modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.quota-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 999px;
  font-size: 14px;
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.18s;
}

.quota-btn:active {
  opacity: 0.7;
}

.quota-btn-outline {
  border: 1.5px solid var(--text-soft);
  background: transparent;
  color: var(--text-soft);
}

.quota-btn-solid {
  border: none;
  background: var(--accent);
  color: white;
}
</style>
