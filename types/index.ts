export interface BudgetRecord {
  id?: string
  name: string
  amount: number
  category: string
  created_at?: string
  user_id?: string
}

export type EntryMode = 'voice' | 'text' | 'camera'
export type HomeTab = 'record' | 'total' | 'analysis'

export const CATEGORIES = ['飲品', '餐飲', '點心', '交通', '購物', '娛樂', '其他'] as const
export type Category = (typeof CATEGORIES)[number]
