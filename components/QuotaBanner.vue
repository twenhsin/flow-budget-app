<template>
  <div v-if="visible" class="quota-banner">
    <span class="quota-banner-text">Demo 模式・總共 10 次 AI 使用額度，30 天內有效</span>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  position: relative;
  z-index: 2;
}

.quota-banner-text {
  font-size: 12px;
  color: var(--text-soft);
  line-height: 1.4;
}

.quota-banner-close {
  flex-shrink: 0;
  margin-left: 8px;
  background: transparent;
  border: none;
  font-size: 12px;
  color: var(--text-soft);
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
}
</style>
