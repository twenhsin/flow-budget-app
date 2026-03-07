<template>
  <div class="layout-bare">
    <slot />
  </div>
</template>

<style scoped>
.layout-bare {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
</style>
