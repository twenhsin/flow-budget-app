/**
 * useQuota
 *
 * 管理 AI 功能使用配額：
 * - 已登入用戶：讀寫 Supabase user_quota 表
 * - 訪客：讀寫 localStorage
 * - 白名單 Email：無限制
 */

const QUOTA_MAX = 10
const QUOTA_DAYS = 30
const WHITELIST_EMAIL = 'wenhsin600@gmail.com'

const LS_USED_COUNT = 'demo_used_count'
const LS_FIRST_USED_AT = 'demo_first_used_at'
const LS_LAST_SYNCED = 'demo_last_synced'

// ── localStorage helpers（SSR 安全）─────────────────────────────────────────

function lsGet(key: string): string | null {
  if (!import.meta.client) return null
  return localStorage.getItem(key)
}

function lsSet(key: string, value: string) {
  if (!import.meta.client) return
  localStorage.setItem(key, value)
}

function isExpired(firstUsedAt: string | null): boolean {
  if (!firstUsedAt) return false
  const diff = Date.now() - new Date(firstUsedAt).getTime()
  return diff > QUOTA_DAYS * 24 * 60 * 60 * 1000
}

// ── Main composable ───────────────────────────────────────────────────────────

export function useQuota() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // ── checkQuota ──────────────────────────────────────────────────────────────

  async function checkQuota(): Promise<{
    allowed: boolean
    remaining: number | null
    reason: 'quota' | 'expired' | null
  }> {
    // 已登入
    if (user.value) {
      const email = user.value.email ?? ''

      // 白名單：無限制
      if (email === WHITELIST_EMAIL) {
        return { allowed: true, remaining: null, reason: null }
      }

      // 從 Supabase 讀取配額
      const { data } = await supabase
        .from('user_quota')
        .select('used_count, is_unlimited, first_used_at')
        .eq('user_id', user.value.id)
        .single()

      if (data?.is_unlimited) {
        return { allowed: true, remaining: null, reason: null }
      }

      const usedCount: number = data?.used_count ?? 0
      const firstUsedAt: string | null = data?.first_used_at ?? null

      if (firstUsedAt && isExpired(firstUsedAt)) {
        return { allowed: false, remaining: 0, reason: 'expired' }
      }

      if (usedCount >= QUOTA_MAX) {
        return { allowed: false, remaining: 0, reason: 'quota' }
      }

      return { allowed: true, remaining: QUOTA_MAX - usedCount, reason: null }
    }

    // 訪客：讀 localStorage
    const usedCount = parseInt(lsGet(LS_USED_COUNT) ?? '0', 10)
    const firstUsedAt = lsGet(LS_FIRST_USED_AT)

    if (firstUsedAt && isExpired(firstUsedAt)) {
      return { allowed: false, remaining: 0, reason: 'expired' }
    }

    if (usedCount >= QUOTA_MAX) {
      return { allowed: false, remaining: 0, reason: 'quota' }
    }

    return { allowed: true, remaining: QUOTA_MAX - usedCount, reason: null }
  }

  // ── incrementQuota ──────────────────────────────────────────────────────────

  async function incrementQuota(): Promise<void> {
    // 已登入
    if (user.value) {
      const email = user.value.email ?? ''
      if (email === WHITELIST_EMAIL) return

      const { data } = await supabase
        .from('user_quota')
        .select('used_count, is_unlimited, first_used_at')
        .eq('user_id', user.value.id)
        .single()

      if (data?.is_unlimited) return

      const now = new Date().toISOString()
      const isFirst = !data

      if (isFirst) {
        await supabase.from('user_quota').insert({
          user_id: user.value.id,
          used_count: 1,
          first_used_at: now,
          updated_at: now,
        })
      }
      else {
        await supabase
          .from('user_quota')
          .update({
            used_count: (data.used_count ?? 0) + 1,
            first_used_at: data.first_used_at ?? now,
            updated_at: now,
          })
          .eq('user_id', user.value.id)
      }

      return
    }

    // 訪客：寫 localStorage
    const usedCount = parseInt(lsGet(LS_USED_COUNT) ?? '0', 10)
    const isFirst = usedCount === 0 && !lsGet(LS_FIRST_USED_AT)

    lsSet(LS_USED_COUNT, String(usedCount + 1))

    if (isFirst) {
      lsSet(LS_FIRST_USED_AT, new Date().toISOString())
    }
  }

  // ── mergeQuotaOnLogin ───────────────────────────────────────────────────────

  async function mergeQuotaOnLogin(): Promise<void> {
    if (!user.value) return

    const localUsed = parseInt(lsGet(LS_USED_COUNT) ?? '0', 10)
    const lastSynced = parseInt(lsGet(LS_LAST_SYNCED) ?? '0', 10)
    const localFirstUsedAt = lsGet(LS_FIRST_USED_AT)
    const delta = Math.max(0, localUsed - lastSynced)

    const { data } = await supabase
      .from('user_quota')
      .select('used_count, first_used_at')
      .eq('user_id', user.value.id)
      .single()

    const now = new Date().toISOString()

    // 計算合併後的 first_used_at（取兩者最早）
    const remoteFirstUsedAt: string | null = data?.first_used_at ?? null
    let mergedFirstUsedAt: string | null = remoteFirstUsedAt

    if (localFirstUsedAt && remoteFirstUsedAt) {
      mergedFirstUsedAt = localFirstUsedAt < remoteFirstUsedAt
        ? localFirstUsedAt
        : remoteFirstUsedAt
    }
    else {
      mergedFirstUsedAt = localFirstUsedAt ?? remoteFirstUsedAt
    }

    const newUsedCount = (data?.used_count ?? 0) + delta

    if (!data) {
      // Supabase 尚無資料 → INSERT
      await supabase.from('user_quota').insert({
        user_id: user.value.id,
        used_count: newUsedCount,
        first_used_at: mergedFirstUsedAt ?? now,
        updated_at: now,
      })
    }
    else {
      // 已有資料 → UPDATE
      await supabase
        .from('user_quota')
        .update({
          used_count: newUsedCount,
          first_used_at: mergedFirstUsedAt,
          updated_at: now,
        })
        .eq('user_id', user.value.id)
    }

    // 更新 last_synced，避免重複計算增量
    lsSet(LS_LAST_SYNCED, String(newUsedCount))
  }

  return {
    checkQuota,
    incrementQuota,
    mergeQuotaOnLogin,
  }
}
