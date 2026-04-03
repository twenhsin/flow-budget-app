<template>
  <div class="auth-screen">
    <div class="orb orb-1" aria-hidden="true" />
    <div class="orb orb-2" aria-hidden="true" />
    <div class="orb orb-3" aria-hidden="true" />

    <div class="auth-card">
      <h1 class="auth-title">帳 · Flow</h1>
      <p class="auth-sub">AI 驅動的輕量記帳</p>

      <div class="auth-tabs">
        <button class="auth-tab" :class="{ active: mode === 'login' }" @click="mode = 'login'">登入</button>
        <button class="auth-tab" :class="{ active: mode === 'signup' }" @click="mode = 'signup'">註冊</button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label class="field-label">電子郵件</label>
          <input
            v-model="email"
            type="email"
            class="field-input"
            placeholder="your@email.com"
            autocomplete="email"
            required
          >
        </div>
        <div class="field">
          <label class="field-label">密碼</label>
          <input
            v-model="password"
            type="password"
            class="field-input"
            placeholder="至少 6 個字元"
            autocomplete="current-password"
            required
          >
        </div>

        <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="auth-success">{{ successMsg }}</p>

        <button type="submit" class="auth-btn" :disabled="isLoading">
          <span v-if="isLoading">處理中…</span>
          <span v-else>{{ mode === 'login' ? '登入' : '建立帳號' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getGuestExpenses } from '~/composables/useGuestExpenses'

definePageMeta({ layout: false })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = useSupabaseClient() as any
const router = useRouter()
const { mergeLocalToSupabase } = useUserCategories()
const { mergeQuotaOnLogin } = useQuota()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

watch(mode, () => {
  errorMsg.value = ''
  successMsg.value = ''
})

// ── 訪客消費紀錄合併到 Supabase ───────────────────────────────────────────────
const mergeLocalExpensesToSupabase = async (): Promise<number> => {
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return 0

  // 步驟一：將 Supabase 中 user_id = null 的訪客資料歸屬到登入帳號（永遠執行）
  await supabase
    .from('expenses')
    .update({ user_id: currentUser.id })
    .is('user_id', null)

  // 步驟二：將 localStorage 的 guest_expenses 寫入 Supabase（有資料才執行）
  const local = getGuestExpenses()
  if (local.length === 0) return 0

  // 取出 Supabase 既有紀錄，用於重複判斷
  const { data: existing } = await supabase
    .from('expenses')
    .select('id, name, amount, created_at')
    .eq('user_id', currentUser.id)
  const existingList: { id: string; name: string; amount: number; created_at: string }[]
    = Array.isArray(existing) ? existing : []

  let syncCount = 0

  for (const exp of local) {
    try {
      const expDate = exp.created_at.slice(0, 10)

      // 找出同一天、同名稱、同金額的重複紀錄
      const duplicates = existingList.filter(e =>
        e.name === exp.name
        && e.amount === exp.amount
        && e.created_at.slice(0, 10) === expDate,
      )

      // 刪除 Supabase 端的重複紀錄
      for (const dup of duplicates) {
        await supabase.from('expenses').delete().eq('id', dup.id)
      }

      // insert localStorage 版本（保留原始 created_at）
      const { error } = await supabase.from('expenses').insert({
        user_id: currentUser.id,
        name: exp.name,
        amount: exp.amount,
        category: exp.category,
        created_at: exp.created_at,
        input_method: exp.input_method ?? 'text',
      })

      if (error) {
        console.error('mergeLocalExpensesToSupabase insert error:', error, exp)
      }
      else {
        syncCount++
      }
    }
    catch (e) {
      console.error('mergeLocalExpensesToSupabase unexpected error:', e, exp)
    }
  }

  return syncCount
}

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  if (mode.value === 'login') {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (error) {
      errorMsg.value = error.message === 'Invalid login credentials'
        ? '電子郵件或密碼錯誤'
        : error.message
    }
    else {
      const syncedCount = await mergeLocalExpensesToSupabase()
      await mergeLocalToSupabase()
      await mergeQuotaOnLogin()
      if (syncedCount > 0) {
        successMsg.value = `已將 ${syncedCount} 筆本地紀錄同步到雲端`
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      router.push('/')
    }
  }
  else {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })
    if (error) {
      errorMsg.value = error.message
    }
    else {
      successMsg.value = '帳號建立成功！請查收確認信，或直接登入。'
      mode.value = 'login'
    }
  }

  isLoading.value = false
}
</script>

<style scoped>
.auth-screen {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(at 15% 15%, rgba(255, 240, 200, 0.9) 0%, transparent 50%),
    radial-gradient(at 85% 20%, rgba(255, 200, 150, 0.7) 0%, transparent 50%),
    radial-gradient(at 50% 75%, rgba(255, 160, 110, 0.6) 0%, transparent 55%),
    linear-gradient(160deg, #FDF0E6 0%, #FBDFC8 55%, #F5C8A8 100%);
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.orb-1 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(255, 230, 160, 0.55) 0%, transparent 70%);
  top: -100px;
  left: -80px;
  animation: orbFloat1 18s ease-in-out infinite;
}

.orb-2 {
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(255, 140, 90, 0.45) 0%, transparent 70%);
  bottom: -60px;
  right: -60px;
  animation: orbFloat2 22s ease-in-out infinite;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 190, 130, 0.45) 0%, transparent 70%);
  top: 50%;
  right: -40px;
  animation: orbFloat3 15s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, 60px) scale(1.1); }
}

@keyframes orbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, -50px) scale(1.15); }
}

@keyframes orbFloat3 {
  0%, 100% { transform: translate(0, -50%) scale(1); }
  50% { transform: translate(-20px, calc(-50% + 30px)) scale(0.9); }
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  padding: 36px 28px;
  box-shadow: var(--shadow-modal);
}

.auth-title {
  font-family: 'Noto Serif TC', serif;
  font-size: 28px;
  font-weight: 300;
  color: var(--text-strong);
  text-align: center;
  margin-bottom: 4px;
}

.auth-sub {
  font-size: 12px;
  color: var(--text-soft);
  text-align: center;
  margin-bottom: 28px;
}

.auth-tabs {
  display: flex;
  background: rgba(224, 122, 79, 0.08);
  border-radius: var(--radius-pill);
  padding: 3px;
  margin-bottom: 24px;
}

.auth-tab {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: var(--radius-pill);
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: var(--text-soft);
  cursor: pointer;
  transition: all 0.2s;
}

.auth-tab.active {
  background: var(--accent);
  color: white;
  font-weight: 500;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: var(--text-soft);
  letter-spacing: 0.04em;
}

.field-input {
  padding: 12px 16px;
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-md);
  background: var(--surface);
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: var(--text-strong);
  outline: none;
  transition: border-color 0.15s;
}

.field-input:focus {
  border-color: var(--accent);
}

.field-input::placeholder {
  color: var(--text-soft);
}

.auth-error {
  font-size: 12px;
  color: var(--destructive);
  text-align: center;
}

.auth-success {
  font-size: 12px;
  color: var(--text-success);
  text-align: center;
  line-height: 1.5;
}

.auth-btn {
  margin-top: 4px;
  padding: 14px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: white;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
}

.auth-btn:active {
  transform: scale(0.97);
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
