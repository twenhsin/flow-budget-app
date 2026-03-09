<template>
  <div class="record-table">
    <div class="table-info">
      <span class="table-date">{{ formattedDate }}</span>
      <span class="table-total">支出：-{{ totalAmount }}</span>
    </div>
    <div class="table-rows">
      <div v-if="records.length === 0" class="table-empty">尚無紀錄</div>
      <div v-for="(record, i) in records" :key="i" class="table-row">
        <div class="cat-icon" :style="{ background: catColor(record.category) }">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" v-html="catPaths(record.category)" />
        </div>
        <span class="row-name">{{ record.name }}</span>
        <span class="row-amount">-{{ record.amount }}</span>
        <button class="row-edit-btn" @click="$emit('edit', i)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BudgetRecord } from '~/types'

const props = defineProps<{ records: BudgetRecord[] }>()
defineEmits<{ edit: [index: number] }>()

const formattedDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})
const totalAmount = computed(() => props.records.reduce((s, r) => s + r.amount, 0))

const CAT_COLORS: Record<string, string> = {
  餐飲: '#E07A4F', 飲料: '#6AADCB', 點心: '#E07A8F',
  居住: '#8E7BBE', 休閒: '#6AB87A', 交通: '#C4A44F', 通訊: '#7AA5E0',
}
const catColor = (cat: string) => CAT_COLORS[cat] ?? '#B0A090'

const CAT_PATHS: Record<string, string> = {
  餐飲: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="22"/>',
  飲料: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>',
  點心: '<path d="M12 2a9 9 0 0 1 9 9c0 3.18-2.09 6.36-4 8H7c-1.91-1.64-4-4.82-4-8a9 9 0 0 1 9-9z"/><line x1="9" y1="22" x2="15" y2="22"/>',
  居住: '<path d="M3 12L12 3l9 9"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"/>',
  休閒: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
  交通: '<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  通訊: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
}
const catPaths = (cat: string) => CAT_PATHS[cat] ?? '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>'
</script>

<style scoped>
.record-table {
  background: var(--surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(196, 98, 45, 0.08);
}

.table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-soft);
  border-bottom: 1px solid var(--border);
}

.table-rows {
  min-height: 60px;
}

.table-row {
  display: grid;
  grid-template-columns: 36px 1fr auto 44px;
  padding: 10px 8px 10px 16px;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--border);
  animation: rowIn 0.25s ease both;
}

.table-row:last-child {
  border-bottom: none;
}

@keyframes rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-icon svg {
  width: 18px;
  height: 18px;
}

.row-name {
  font-size: 14px;
  color: var(--text);
}

.row-amount {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.row-edit-btn {
  background: none;
  border: none;
  color: #EC844C;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  transition: color 0.15s;
}

.row-edit-btn:active {
  color: var(--text);
}

.row-edit-btn svg {
  width: 20px;
  height: 20px;
}

.table-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-soft);
}
</style>
