export interface BudgetRecord {
  id?: string
  name: string
  amount: number
  category: string
  created_at?: string
  user_id?: string
}

export type EntryMode = 'voice' | 'text' | 'camera'
export type HomeTab = 'record' | 'stats' | 'analysis'

export const CATEGORIES = ['餐飲', '飲料', '點心', '居住', '休閒', '交通', '通訊', '其他']
export type Category = string
