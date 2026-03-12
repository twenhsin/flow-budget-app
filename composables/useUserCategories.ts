/**
 * useUserCategories
 *
 * 登入用戶：從 Supabase `categories` 表讀取，CRUD 直接操作 Supabase
 * 訪客：從 localStorage 讀取，CRUD 操作 localStorage
 *
 * 使用 Nuxt useState 確保 SSR hydration 正確，跨元件共享同一份快取
 */
import {
  getUserCategories,
  saveUserCategory as saveLocalCategory,
  updateUserCategory as updateLocalCategory,
  deleteUserCategory as deleteLocalCategory,
} from '~/constants/categories'
import type { UserCategory } from '~/constants/categories'

const LOCAL_KEY = 'userCategories'

export function useUserCategories() {
  const categories = useState<UserCategory[]>('userCategories', () => [])
  const loaded = useState<boolean>('userCategoriesLoaded', () => false)
  // localLoaded: 本 session 是否已做過同步 localStorage 讀取
  const localLoaded = useState<boolean>('userCategoriesLocalLoaded', () => false)

  // ── Synchronous bootstrap ─────────────────────────────────────────────────
  // 在 component setup 階段（第一次 render 前）同步從 localStorage 讀入資料。
  // 確保 CatIcon 在第一次 paint 就能拿到正確 icon（消除初始閃爍）。
  // 對已登入用戶這是暫態佔位，之後 load() 會從 Supabase 覆蓋。
  if (import.meta.client && !localLoaded.value) {
    localLoaded.value = true
    categories.value = getUserCategories()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useSupabaseClient() as any
  const user = useSupabaseUser()

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    if (!import.meta.client) return
    if (loaded.value) return

    if (user.value) {
      try {
        const { data } = await supabase
          .from('categories')
          .select('name, color, icon')
          .eq('user_id', user.value.id)
          .order('sort_order', { ascending: true })
        if (Array.isArray(data)) {
          categories.value = data as UserCategory[]
        }
      }
      catch {
        // categories 表尚未建立時 fallback 到 localStorage
        categories.value = getUserCategories()
      }
    }
    else {
      categories.value = getUserCategories()
    }

    loaded.value = true
  }

  // Run on every component mount but only fetch once per page session
  onMounted(() => {
    if (!loaded.value) load()
  })

  // ── Merge localStorage → Supabase (登入後立即呼叫) ───────────────────────
  // 使用 supabase.auth.getUser() 取得 user，避免 reactive state 尚未傳播的 timing 問題
  const mergeLocalToSupabase = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    const local = getUserCategories()

    if (local.length > 0) {
      try {
        // 取出 Supabase 既有的類別名稱
        const { data: existing } = await supabase
          .from('categories')
          .select('name')
          .eq('user_id', currentUser.id)

        const existingNames = new Set<string>(
          Array.isArray(existing) ? existing.map((c: { name: string }) => c.name) : [],
        )

        for (const cat of local) {
          if (existingNames.has(cat.name)) {
            // 同名類別：以 localStorage 的 icon/color 為主，更新 Supabase
            await supabase
              .from('categories')
              .update({ color: cat.color, icon: cat.icon })
              .eq('user_id', currentUser.id)
              .eq('name', cat.name)
          }
          else {
            // 僅 localStorage 有的類別：insert 到 Supabase
            await supabase
              .from('categories')
              .insert({ user_id: currentUser.id, name: cat.name, color: cat.color, icon: cat.icon })
          }
        }

        // 合併完成後清空 localStorage 的自訂類別
        localStorage.removeItem(LOCAL_KEY)
      }
      catch {
        // merge 失敗時保留 localStorage 作為 fallback
      }
    }

    // 強制從 Supabase 重新載入最終狀態
    loaded.value = false
    await load()
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** 新增類別：已登入寫 Supabase，訪客寫 localStorage */
  const saveCat = async (cat: UserCategory) => {
    if (user.value) {
      await supabase
        .from('categories')
        .insert({ user_id: user.value.id, name: cat.name, color: cat.color, icon: cat.icon })
    }
    else {
      saveLocalCategory(cat)
    }
    if (!categories.value.find(c => c.name === cat.name)) {
      categories.value = [...categories.value, cat]
    }
  }

  /** 更新類別：已登入寫 Supabase，訪客寫 localStorage */
  const updateCat = async (oldName: string, cat: UserCategory) => {
    if (user.value) {
      await supabase
        .from('categories')
        .update({ name: cat.name, color: cat.color, icon: cat.icon })
        .eq('user_id', user.value.id)
        .eq('name', oldName)
    }
    else {
      updateLocalCategory(oldName, cat)
    }
    const idx = categories.value.findIndex(c => c.name === oldName)
    if (idx !== -1) {
      const updated = [...categories.value]
      updated[idx] = cat
      categories.value = updated
    }
  }

  /** 刪除類別：已登入寫 Supabase，訪客寫 localStorage */
  const deleteCat = async (name: string) => {
    if (user.value) {
      await supabase
        .from('categories')
        .delete()
        .eq('user_id', user.value.id)
        .eq('name', name)
    }
    else {
      deleteLocalCategory(name)
    }
    categories.value = categories.value.filter(c => c.name !== name)
  }

  // ── Lookup helpers ────────────────────────────────────────────────────────

  /** Exact-match by name — returns lucide icon name or null for built-ins */
  const getCatIcon = (name: string): string | null => {
    const found = categories.value.find(c => c.name === name)
    return found ? found.icon : null
  }

  /** Exact-match by name — returns stored color or undefined */
  const getCatColor = (name: string): string | undefined => {
    return categories.value.find(c => c.name === name)?.color
  }

  /** Force a full reload — call after add/update/delete if needed */
  const reload = async () => {
    loaded.value = false
    await load()
  }

  return {
    categories,
    loaded,
    localLoaded,
    load,
    reload,
    mergeLocalToSupabase,
    saveCat,
    updateCat,
    deleteCat,
    getCatIcon,
    getCatColor,
  }
}
