<template>
  <div class="placeholder-screen">
    <h2>帳號</h2>
    <p>功能開發中</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<style scoped>
.placeholder-screen {
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #FDF0E6 0%, #FBDFC8 55%, #F5C8A8 100%);
  gap: 8px;
}

h2 {
  font-family: 'Noto Serif TC', serif;
  font-size: 24px;
  font-weight: 300;
}

p {
  font-size: 14px;
  color: var(--text-soft);
}
</style>
