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
}

.layout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
