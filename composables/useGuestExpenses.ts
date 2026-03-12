export interface GuestExpense {
  id: string
  name: string
  amount: number
  category: string
  created_at: string
  input_method?: string
}

const KEY = 'guest_expenses'

export function getGuestExpenses(): GuestExpense[] {
  if (!import.meta.client) return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  }
  catch { return [] }
}

export function addGuestExpense(data: Omit<GuestExpense, 'id' | 'created_at'>): GuestExpense {
  const all = getGuestExpenses()
  const entry: GuestExpense = {
    ...data,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  all.unshift(entry)
  localStorage.setItem(KEY, JSON.stringify(all))
  return entry
}

export function updateGuestExpense(id: string, data: Partial<Pick<GuestExpense, 'name' | 'amount' | 'category'>>) {
  const all = getGuestExpenses()
  const idx = all.findIndex(e => e.id === id)
  if (idx !== -1) all[idx] = { ...all[idx], ...data }
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deleteGuestExpense(id: string) {
  const all = getGuestExpenses().filter(e => e.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}
