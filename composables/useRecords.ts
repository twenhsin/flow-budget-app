import type { BudgetRecord } from '~/types'

export const useRecords = () => {
  const pendingRecords = useState<BudgetRecord[]>('pendingRecords', () => [])

  const addRecord = (record: BudgetRecord) => {
    pendingRecords.value.push(record)
  }

  const removeRecord = (index: number) => {
    pendingRecords.value.splice(index, 1)
  }

  const updateRecord = (index: number, record: BudgetRecord) => {
    pendingRecords.value[index] = { ...record }
  }

  const clearRecords = () => {
    pendingRecords.value = []
  }

  const guessCategory = (name: string): string => {
    if (/咖啡|茶|飲|奶/.test(name)) return '飲品'
    if (/飯|麵|餐|食|吃|便當/.test(name)) return '餐飲'
    if (/捷運|公車|計程車|油/.test(name)) return '交通'
    if (/蛋糕|餅|糖|甜/.test(name)) return '點心'
    return '其他'
  }

  const parseTextEntry = (text: string): BudgetRecord => {
    const match = text.match(/(\d+)/)
    const amount = match ? parseInt(match[1]) : 0
    const name = text.replace(/\d+/g, '').replace(/[元塊$/,\s]/g, '').trim() || text
    return { name: name || text, amount, category: guessCategory(name) }
  }

  return {
    pendingRecords,
    addRecord,
    removeRecord,
    updateRecord,
    clearRecords,
    parseTextEntry,
    guessCategory,
  }
}
