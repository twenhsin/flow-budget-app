<template>
  <div class="layout-with-nav">
    <div class="layout-content">
      <slot />
    </div>
    <BottomNav />
  </div>
</template>

<style scoped>
.layout-with-nav {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
}

.layout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}
</style>
