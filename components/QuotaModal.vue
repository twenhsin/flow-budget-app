<template>
  <div
    class="quota-modal-overlay"
    style="background: rgba(0, 0, 0, 0.35);"
    @click.self="$emit('close')"
  >
    <div class="quota-modal-card">
      <div class="quota-modal-title">{{ title }}</div>
      <div class="quota-modal-desc">{{ desc }}</div>
      <a href="mailto:wenhsin600@gmail.com" class="quota-modal-email">wenhsin600@gmail.com</a>
      <button class="quota-modal-close-btn" @click="$emit('close')">關閉</button>
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
    ? 'Demo 使用期限為 30 天，如需繼續使用請聯繫我'
    : '你已使用完 10 次 Demo 額度，如需繼續使用請聯繫我',
)
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
  max-width: 360px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.8);
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.quota-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  text-align: center;
}

.quota-modal-desc {
  font-size: 14px;
  color: var(--text-soft);
  text-align: center;
  line-height: 1.6;
}

.quota-modal-email {
  font-size: 14px;
  color: var(--accent);
  text-decoration: none;
  margin-top: 2px;
}

.quota-modal-email:active {
  opacity: 0.7;
}

.quota-modal-close-btn {
  margin-top: 8px;
  padding: 10px 32px;
  border-radius: 100px;
  border: none;
  background: var(--accent);
  color: white;
  font-size: 14px;
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.18s;
}

.quota-modal-close-btn:active {
  opacity: 0.8;
}
</style>
