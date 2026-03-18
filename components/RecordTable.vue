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
          <CatIcon :category="record.category" :size="14" :stroke-width="1.8" />
        </div>
        <div class="row-info">
          <span class="row-name">{{ record.name }}</span>
          <span class="row-cat">{{ record.category }}</span>
        </div>
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
import { catColor as catColorBuiltin } from '~/constants/categories'
const { getCatColor } = useUserCategories()
const catColor = (name: string) => getCatColor(name) ?? catColorBuiltin(name)

const props = defineProps<{ records: BudgetRecord[] }>()
defineEmits<{ edit: [index: number] }>()

const formattedDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})
const totalAmount = computed(() => props.records.reduce((s, r) => s + r.amount, 0))
</script>

<style scoped>
.record-table {
  background: var(--surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  font-size: 12px;
  color: var(--text-soft);
  border-bottom: 1px solid var(--border);
}

.table-rows {
  min-height: 60px;
}

.table-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 10px 14px;
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
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}


.row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.row-name {
  font-size: 14px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-cat {
  font-size: 12px;
  color: var(--text-soft);
}

.row-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.row-edit-btn {
  background: none;
  border: none;
  color: var(--accent);
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
  font-size: 12px;
  color: var(--text-soft);
}
</style>
