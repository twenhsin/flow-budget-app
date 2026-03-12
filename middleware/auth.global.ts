export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // 已登入時訪問 /auth 自動跳回首頁
  if (user.value && to.path === '/auth') {
    return navigateTo('/')
  }
})
