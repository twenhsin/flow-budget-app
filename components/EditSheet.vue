<template>
  <Transition name="overlay">
    <div
      v-if="visible"
      class="edit-overlay"
      @click.self="$emit('close')"
    >
      <div class="edit-sheet">
        <h3>編輯項目</h3>
        <div class="edit-field">
          <label>項目名稱</label>
          <input v-model="form.name" type="text" placeholder="例：咖啡">
        </div>
        <div class="edit-field">
          <label>金額</label>
          <input v-model.number="form.amount" type="number" placeholder="0">
        </div>
        <div class="edit-field">
          <label>類別</label>
          <select v-model="form.category">
            <option v-for="cat in CATEGORIES" :key="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="edit-actions">
          <button class="edit-cancel-btn" @click="$emit('close')">取消</button>
          <button class="edit-save-btn" @click="save">儲存</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/types'
import type { BudgetRecord } from '~/types'

const props = defineProps<{
  visible: boolean
  record: BudgetRecord | null
}>()

const emit = defineEmits<{
  close: []
  save: [record: BudgetRecord]
}>()

const form = reactive<BudgetRecord>({
  name: '',
  amount: 0,
  category: '其他',
})

watch(
  () => props.record,
  (r) => { if (r) Object.assign(form, r) },
  { immediate: true },
)

const save = () => emit('save', { ...form })
</script>

<style scoped>
.edit-overlay {
  position: absolute;
  inset: 0;
  background: rgba(139, 94, 60, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.edit-sheet {
  background: var(--surface-solid);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 24px 24px calc(32px + env(safe-area-inset-bottom));
  width: 100%;
  animation: slideUp 0.25s ease;
}

h3 {
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 16px;
  color: var(--text);
}

.edit-field {
  margin-bottom: 12px;
}

.edit-field label {
  display: block;
  font-size: 11px;
  color: var(--text-soft);
  margin-bottom: 6px;
  letter-spacing: 0.05em;
}

.edit-field input,
.edit-field select {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
}

.edit-field input:focus,
.edit-field select:focus {
  border-color: var(--accent);
}

.edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.edit-cancel-btn,
.edit-save-btn {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-pill);
  border: none;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s;
}

.edit-cancel-btn {
  background: rgba(196, 168, 130, 0.25);
  color: var(--text);
}

.edit-save-btn {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 12px rgba(224, 122, 79, 0.3);
}

.edit-save-btn:active {
  transform: scale(0.97);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
