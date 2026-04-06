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
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  overflow-x: hidden;
}
</style>
