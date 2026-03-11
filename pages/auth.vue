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
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const router = useRouter()

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
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 36px 28px;
  box-shadow: 0 8px 40px rgba(196, 98, 45, 0.12);
}

.auth-title {
  font-family: 'Noto Serif TC', serif;
  font-size: 28px;
  font-weight: 300;
  color: #5C3D2E;
  text-align: center;
  margin-bottom: 4px;
}

.auth-sub {
  font-size: 13px;
  color: #B18272;
  text-align: center;
  margin-bottom: 28px;
}

.auth-tabs {
  display: flex;
  background: rgba(224, 122, 79, 0.08);
  border-radius: 40px;
  padding: 3px;
  margin-bottom: 24px;
}

.auth-tab {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 40px;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: #B18272;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-tab.active {
  background: #E07A4F;
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
  color: #B18272;
  letter-spacing: 0.04em;
}

.field-input {
  padding: 12px 16px;
  border: 1px solid rgba(224, 122, 79, 0.25);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
  color: #3D2314;
  outline: none;
  transition: border-color 0.15s;
}

.field-input:focus {
  border-color: #E07A4F;
}

.field-input::placeholder {
  color: #C4A090;
}

.auth-error {
  font-size: 13px;
  color: #D04A20;
  text-align: center;
}

.auth-success {
  font-size: 13px;
  color: #4A9060;
  text-align: center;
  line-height: 1.5;
}

.auth-btn {
  margin-top: 4px;
  padding: 14px;
  border: none;
  border-radius: 40px;
  background: #E07A4F;
  color: white;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 15px;
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
