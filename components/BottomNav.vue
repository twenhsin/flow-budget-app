<template>
  <nav class="bottom-nav">
    <NuxtLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
      <div class="nav-dot" :class="{ visible: hasNotification }" />
      <div class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 12h8M8 8h8M8 16h5" />
        </svg>
      </div>
      <span class="nav-label">紀錄</span>
    </NuxtLink>

    <NuxtLink to="/analysis" class="nav-item" :class="{ active: route.path === '/analysis' }">
      <div class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 21H4.6A1.6 1.6 0 0 1 3 19.4V3" />
          <path d="M7 16l4-5 4 3 5-7" />
        </svg>
      </div>
      <span class="nav-label">分析</span>
    </NuxtLink>

    <NuxtLink to="/stats" class="nav-item" :class="{ active: route.path === '/stats' }">
      <div class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </div>
      <span class="nav-label">統計</span>
    </NuxtLink>

    <NuxtLink to="/account" class="nav-item" :class="{ active: route.path === '/account' }">
      <div class="nav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <span class="nav-label">帳號</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const hasNotification = useState('hasNotification', () => false)
</script>

<style scoped>
.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 12px 8px calc(12px + env(safe-area-inset-bottom));
  background: rgba(253, 240, 230, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(196, 168, 130, 0.25);
  position: sticky;
  bottom: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  cursor: pointer;
  position: relative;
  text-decoration: none;
}

.nav-dot {
  position: absolute;
  top: 4px;
  right: 12px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #E05252;
  display: none;
}

.nav-dot.visible {
  display: block;
}

.nav-icon {
  color: var(--text-soft);
}

.nav-icon svg {
  width: 22px;
  height: 22px;
}

.nav-item.active .nav-icon {
  color: var(--accent);
}

.nav-label {
  font-size: 12px;
  color: var(--text-soft);
  letter-spacing: 0.04em;
}

.nav-item.active .nav-label {
  color: var(--accent);
}
</style>
