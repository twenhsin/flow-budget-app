<template>
  <div class="account-screen">
    <div class="orb orb-1" aria-hidden="true" />
    <div class="orb orb-2" aria-hidden="true" />
    <div class="orb orb-3" aria-hidden="true" />

    <div class="account-body">
      <!-- Avatar + Email -->
      <div class="user-card">
        <div class="user-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <div class="user-info">
          <span class="user-email">{{ user?.email }}</span>
          <span class="user-since">記帳中</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="action-list">
        <button class="action-row logout-row" :disabled="isLoading" @click="handleLogout">
          <span class="action-label">{{ isLoading ? '登出中…' : '登出' }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="nav-spacer" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const isLoading = ref(false)

const handleLogout = async () => {
  isLoading.value = true
  await supabase.auth.signOut()
  router.push('/auth')
}
</script>

<style scoped>
.account-screen {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background-color: #fffaf0;
  background-image:
    radial-gradient(at 10% 20%, rgba(255, 245, 220, 0.8) 0px, transparent 50%),
    radial-gradient(at 90% 10%, rgba(255, 230, 180, 0.7) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(255, 190, 140, 0.6) 0px, transparent 60%),
    linear-gradient(135deg, #fffcf5 0%, #ffe4cc 40%, #ffd1b3 70%, #ffc0a0 100%);
  position: relative;
}

.orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 230, 160, 0.5) 0%, transparent 70%);
  top: -80px;
  left: -60px;
  animation: aOrbFloat1 18s ease-in-out infinite;
}

.orb-2 {
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(255, 140, 90, 0.4) 0%, transparent 70%);
  top: 30%;
  right: -50px;
  animation: aOrbFloat2 22s ease-in-out infinite;
}

.orb-3 {
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(255, 190, 130, 0.4) 0%, transparent 70%);
  bottom: -60px;
  left: -30px;
  animation: aOrbFloat3 16s ease-in-out infinite;
}

@keyframes aOrbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 50px) scale(1.1); }
}

@keyframes aOrbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-25px, 40px) scale(1.12); }
}

@keyframes aOrbFloat3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -40px) scale(0.92); }
}

.account-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 48px 20px 24px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 2px 16px rgba(196, 98, 45, 0.08);
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(224, 122, 79, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #E07A4F;
}

.user-avatar svg {
  width: 28px;
  height: 28px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-email {
  font-size: 15px;
  font-weight: 500;
  color: #3D2314;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-since {
  font-size: 12px;
  color: #B18272;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 16px;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(196, 98, 45, 0.06);
  transition: all 0.18s;
  width: 100%;
}

.action-row:active {
  transform: scale(0.98);
}

.action-label {
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  color: #3D2314;
}

.logout-row {
  color: #D04A20;
}

.logout-row .action-label {
  color: #D04A20;
}

.logout-row svg {
  width: 20px;
  height: 20px;
  color: #D04A20;
}

.logout-row:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-spacer {
  flex-shrink: 0;
  height: calc(72px + env(safe-area-inset-bottom));
}
</style>
