<template>
  <div class="record-table">
    <div class="table-head">
      <span>項目</span>
      <span>金額</span>
      <span>類別</span>
      <span />
    </div>
    <div class="table-rows">
      <div v-if="records.length === 0" class="table-empty">尚無紀錄</div>
      <div
        v-for="(record, i) in records"
        :key="i"
        class="table-row"
      >
        <span>{{ record.name }}</span>
        <span>{{ record.amount }}</span>
        <span>{{ record.category }}</span>
        <div class="row-actions">
          <button class="row-action-btn" @click="$emit('edit', i)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="row-action-btn" @click="$emit('delete', i)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BudgetRecord } from '~/types'

defineProps<{ records: BudgetRecord[] }>()
defineEmits<{
  edit: [index: number]
  delete: [index: number]
}>()
</script>

<style scoped>
.record-table {
  background: var(--surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(196, 98, 45, 0.08);
}

.table-head {
  display: grid;
  grid-template-columns: 1fr 80px 80px 52px;
  padding: 12px 16px;
  font-size: 12px;
  color: var(--text-soft);
  border-bottom: 1px solid var(--border);
}

.table-rows {
  min-height: 60px;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 80px 80px 52px;
  padding: 13px 16px;
  font-size: 14px;
  align-items: center;
  border-bottom: 1px solid var(--border);
  animation: rowIn 0.25s ease both;
}

.table-row:last-child {
  border-bottom: none;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.row-action-btn {
  background: none;
  border: none;
  color: var(--text-soft);
  cursor: pointer;
  padding: 2px;
  transition: color 0.15s;
}

.row-action-btn:active {
  color: var(--accent);
}

.row-action-btn svg {
  width: 14px;
  height: 14px;
}

.table-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-soft);
}
</style>
