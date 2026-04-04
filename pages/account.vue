<template>
  <div class="account-screen">
    <div class="orb orb-1" aria-hidden="true" />
    <div class="orb orb-2" aria-hidden="true" />
    <div class="orb orb-3" aria-hidden="true" />

    <div class="account-body">
      <!-- 已登入 -->
      <template v-if="user">
        <div class="user-card">
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div class="user-info">
            <span class="user-email">{{ user.email }}</span>
            <span class="user-since">記帳中</span>
          </div>
        </div>

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
      </template>

      <!-- 訪客 -->
      <template v-else>
        <div class="guest-card">
          <div class="guest-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <p class="guest-title">訪客模式</p>
          <p class="guest-desc">資料暫存於本機<br>登入後可跨裝置同步</p>
        </div>

        <div class="action-list">
          <button class="action-row" @click="navigateTo('/auth')">
            <span class="action-label">登入</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </button>
          <button class="action-row" @click="goSignup">
            <span class="action-label">建立帳號</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </button>
        </div>

        <div class="demo-card">
          <div class="demo-title">Demo 模式說明</div>
          <ul class="demo-list">
            <li>每日總共10次AI使用次數（記帳＋查詢）</li>
            <li>首次使用起 30 天內有效</li>
            <li>使用期限後，仍可瀏覽過去紀錄，但無法進行記帳與查詢等 AI 功能</li>
            <li>如需繼續使用，請與我聯繫</li>
          </ul>
          <button class="demo-apply-btn" @click="applyDemo">申請使用</button>
        </div>
      </template>
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
  router.push('/')
}

const goSignup = () => navigateTo('/auth?tab=signup')

const applyDemo = () => {
  window.location.href = 'mailto:wenhsin600@gmail.com?subject=Filo Demo 申請使用'
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
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(255, 230, 160, 0.5) 0%, transparent 70%);
  top: -80px; left: -60px;
  animation: aOrbFloat1 18s ease-in-out infinite;
}

.orb-2 {
  width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(255, 140, 90, 0.4) 0%, transparent 70%);
  top: 30%; right: -50px;
  animation: aOrbFloat2 22s ease-in-out infinite;
}

.orb-3 {
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(255, 190, 130, 0.4) 0%, transparent 70%);
  bottom: -60px; left: -30px;
  animation: aOrbFloat3 16s ease-in-out infinite;
}

@keyframes aOrbFloat1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, 50px) scale(1.1); } }
@keyframes aOrbFloat2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-25px, 40px) scale(1.12); } }
@keyframes aOrbFloat3 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(20px, -40px) scale(0.92); } }

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

/* 已登入 */
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
}

.user-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(224, 122, 79, 0.12);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--accent);
}

.user-avatar svg { width: 28px; height: 28px; }

.user-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.user-email { font-size: 14px; font-weight: 500; color: var(--text-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-since { font-size: 12px; color: var(--text-soft); }

/* 訪客 */
.guest-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  box-shadow: var(--shadow-card);
  text-align: center;
}

.guest-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(224, 122, 79, 0.1);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-soft);
  margin-bottom: 4px;
}

.guest-icon svg { width: 28px; height: 28px; }

.guest-title { font-size: 16px; font-weight: 500; color: var(--text-strong); }
.guest-desc { font-size: 12px; color: var(--text-soft); line-height: 1.6; }

/* 通用 action */
.action-list { display: flex; flex-direction: column; gap: 8px; }

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--surface);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.18s;
  width: 100%;
}

.action-row:active { transform: scale(0.98); }

.action-label { font-family: 'Noto Sans TC', sans-serif; font-size: 14px; color: var(--text-strong); }

.action-row svg { width: 20px; height: 20px; color: var(--text-soft); }

.logout-row .action-label { color: var(--destructive); }
.logout-row svg { color: var(--destructive); }
.logout-row:disabled { opacity: 0.6; cursor: not-allowed; }

.nav-spacer { flex-shrink: 0; height: calc(72px + env(safe-area-inset-bottom)); }

.demo-card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.demo-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo-list li {
  font-size: 14px;
  color: var(--text-soft);
  line-height: 1.6;
}

.demo-apply-btn {
  align-self: center;
  margin-top: 4px;
  padding: 10px 24px;
  border-radius: 999px;
  border: none;
  background: var(--accent);
  color: white;
  font-size: 14px;
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.18s;
}

.demo-apply-btn:active {
  opacity: 0.8;
}
</style>
