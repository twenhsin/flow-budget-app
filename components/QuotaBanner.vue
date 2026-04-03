<template>
  <div v-if="visible" class="quota-banner">
    <span class="quota-banner-text">Demo模式，每日使用AI次數共計10次。可使用期限為30天</span>
    <button class="quota-banner-close" aria-label="關閉" @click="dismiss">✕</button>
  </div>
</template>

<script setup lang="ts">
const DISMISSED_KEY = 'demo_banner_dismissed'

const visible = ref(false)

onMounted(() => {
  if (!localStorage.getItem(DISMISSED_KEY)) {
    visible.value = true
  }
})

const dismiss = () => {
  visible.value = false
  localStorage.setItem(DISMISSED_KEY, '1')
}
</script>

<style scoped>
.quota-banner {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48px);
  max-width: 382px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  z-index: 50;
}

.quota-banner-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-soft);
  line-height: 1.4;
  letter-spacing: 0.04em;
}

.quota-banner-close {
  flex-shrink: 0;
  margin-left: 8px;
  background: transparent;
  border: none;
  font-size: 14px;
  color: var(--text-soft);
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
}
</style>
