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
    if (/咖啡|茶|奶茶|飲|果汁|珍珠/.test(name)) return '飲料'
    if (/飯|麵|餐|便當|食|吃|豆漿|早餐|午餐|晚餐/.test(name)) return '餐飲'
    if (/蛋糕|餅|糖|甜|冰|布丁/.test(name)) return '點心'
    if (/房租|水電|瓦斯|洗髮|洗衣|沐浴|清潔|衛生紙|日用/.test(name)) return '居住'
    if (/捷運|公車|計程車|Uber|油|停車|高鐵|火車/.test(name)) return '交通'
    if (/電影|遊戲|書|雜誌|健身|旅遊/.test(name)) return '休閒'
    if (/手機|網路|電話|訂閱/.test(name)) return '通訊'
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
