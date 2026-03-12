/**
 * useUserCategories
 *
 * 登入用戶：從 Supabase `categories` 表讀取，以 user_id + name 精確比對
 * 訪客：從 localStorage 讀取
 *
 * 使用 Nuxt useState 確保 SSR hydration 正確，跨元件共享同一份快取
 */
import { getUserCategories } from '~/constants/categories'
import type { UserCategory } from '~/constants/categories'

export function useUserCategories() {
  // useState is SSR-safe and shared across all components in the same page
  const categories = useState<UserCategory[]>('userCategories', () => [])
  const loaded = useState<boolean>('userCategoriesLoaded', () => false)
  // localLoaded tracks whether we've done the sync localStorage read this session
  const localLoaded = useState<boolean>('userCategoriesLocalLoaded', () => false)

  // ── Synchronous bootstrap ─────────────────────────────────────────────────
  // Run during component SETUP (before first render), not in onMounted.
  // This guarantees CatIcon sees correct data even on the very first paint.
  if (import.meta.client && !localLoaded.value) {
    localLoaded.value = true
    categories.value = getUserCategories()
  }

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const load = async () => {
    if (!import.meta.client) return
    if (loaded.value) return

    // Ensure localStorage data is present (covers edge-cases where setup
    // ran on server and localLoaded was never set on this client session)
    const local = getUserCategories()
    categories.value = local

    if (user.value) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('categories')
          .select('name, color, icon')
          .eq('user_id', user.value.id)
        if (Array.isArray(data) && data.length > 0) {
          categories.value = data as UserCategory[]
        }
      }
      catch {
        // categories table may not exist — keep localStorage data
      }
    }

    loaded.value = true
    console.log('categories loaded', categories.value)
  }

  // Run on every component mount but only fetch once per page session
  onMounted(() => {
    if (!loaded.value) load()
  })

  /** Exact-match by name — returns lucide icon name or null for built-ins */
  const getCatIcon = (name: string): string | null => {
    const found = categories.value.find(c => c.name === name)
    return found ? found.icon : null
  }

  /** Exact-match by name — returns stored color or undefined */
  const getCatColor = (name: string): string | undefined => {
    return categories.value.find(c => c.name === name)?.color
  }

  /** Force a full reload — call after add / update / delete */
  const reload = async () => {
    loaded.value = false
    await load()
  }

  return { categories, loaded, load, getCatIcon, getCatColor, reload, localLoaded }
}
