<template>
  <Transition name="overlay">
    <div
      v-if="visible"
      class="edit-overlay"
      @click.self="$emit('close')"
    >
      <div class="edit-sheet" :style="bottomOffset ? { marginBottom: bottomOffset + 'px' } : {}">
        <div class="edit-sheet-header">
          <h3>編輯項目</h3>
          <button class="delete-btn" @click="$emit('delete')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
        <div class="edit-field category-wrap">
          <label>類別</label>
          <button type="button" class="category-trigger" @click="toggleDropdown">
            <span>{{ form.category || '選擇類別' }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <Transition name="dropdown">
            <div v-if="dropdownOpen" class="category-panel">
              <ul class="category-list">
                <li class="cat-add-item" @click="openAddModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  新增類別
                </li>
                <li
                  v-for="cat in allCategoryItems"
                  :key="cat.name"
                  :class="{ selected: form.category === cat.name }"
                  @click="selectCategory(cat.name)"
                >
                  <span class="cat-icon-wrap" :style="{ background: cat.color }">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" v-html="cat.path" />
                  </span>
                  {{ cat.name }}
                </li>
              </ul>
            </div>
          </Transition>
        </div>
        <div class="edit-field">
          <label>項目名稱</label>
          <input v-model="form.name" type="text" placeholder="例：咖啡">
        </div>
        <div class="edit-field">
          <label>金額</label>
          <input v-model.number="form.amount" type="number" placeholder="0">
        </div>

        <div class="edit-actions">
          <button class="edit-cancel-btn" @click="$emit('close')">取消</button>
          <button class="edit-save-btn" @click="save">儲存</button>
        </div>

        <!-- Add Category Modal (inside sheet so it inherits width) -->
        <Transition name="modal">
          <div v-if="addModalOpen" class="add-modal-overlay" @click.self="closeAddModal">
            <div class="add-modal">
            <div class="add-modal-title">新增類別</div>

            <!-- Step 1: input name -->
            <template v-if="addStep === 'input'">
              <input
                ref="addCatInput"
                v-model="addCatName"
                class="add-cat-input"
                type="text"
                placeholder="輸入類別名稱"
                @keydown.enter.prevent="suggestCategory"
              >
              <div class="add-modal-actions">
                <button class="add-modal-cancel" @click="closeAddModal">取消</button>
                <button class="add-modal-confirm" :disabled="!addCatName.trim()" @click="suggestCategory">
                  AI 配置
                </button>
              </div>
            </template>

            <!-- Step 2: loading -->
            <template v-else-if="addStep === 'loading'">
              <div class="add-loading">
                <div class="add-spinner" />
                <span>AI 配置中...</span>
              </div>
            </template>

            <!-- Step 3: preview -->
            <template v-else-if="addStep === 'preview' && suggestion">
              <div class="add-preview">
                <div class="preview-icon" :style="{ background: suggestion.color }">
                  <component :is="lucideIcon(suggestion.icon)" :size="18" color="white" :stroke-width="1.8" />
                </div>
                <span class="preview-name">{{ addCatName }}</span>
              </div>
              <div class="add-modal-actions">
                <button class="add-modal-cancel" @click="addStep = 'input'">重新輸入</button>
                <button class="add-modal-confirm" @click="confirmAddCategory">確認新增</button>
              </div>
            </template>
            </div>
          </div>
        </Transition>
      </div>

      <!-- backdrop to close dropdown -->
      <div v-if="dropdownOpen" class="dropdown-backdrop" @click="dropdownOpen = false" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import * as LucideIcons from 'lucide-vue-next'
import { CATEGORIES, LUCIDE_PATHS, getUserCategories, saveUserCategory } from '~/constants/categories'
import type { UserCategory } from '~/constants/categories'
import type { BudgetRecord } from '~/types'

const props = defineProps<{
  visible: boolean
  record: BudgetRecord | null
  bottomOffset?: number
}>()

const emit = defineEmits<{
  close: []
  save: [record: BudgetRecord]
  delete: []
}>()

const form = reactive<BudgetRecord>({
  name: '',
  amount: 0,
  category: '餐飲',
})

// ── Category list ──────────────────────────────────────────────────────────────

const userCats = ref<UserCategory[]>([])

const loadUserCats = () => { userCats.value = getUserCategories() }

const DEFAULT_PATH = '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>'

const allCategoryItems = computed(() => [
  ...CATEGORIES.map(c => ({ name: c.name, color: c.color, path: c.path })),
  ...userCats.value
    .filter(u => !CATEGORIES.find(c => c.name === u.name))
    .map(u => ({ name: u.name, color: u.color, path: LUCIDE_PATHS[u.icon] ?? DEFAULT_PATH })),
])

const dropdownOpen = ref(false)

const toggleDropdown = () => {
  loadUserCats()
  dropdownOpen.value = !dropdownOpen.value
}

const selectCategory = (cat: string) => {
  form.category = cat
  dropdownOpen.value = false
}

// ── Add Category Modal ─────────────────────────────────────────────────────────

type AddStep = 'input' | 'loading' | 'preview'

const addModalOpen = ref(false)
const addStep = ref<AddStep>('input')
const addCatName = ref('')
const addCatInput = ref<HTMLInputElement | null>(null)
const suggestion = ref<{ icon: string; color: string } | null>(null)

const openAddModal = () => {
  dropdownOpen.value = false
  addCatName.value = ''
  addStep.value = 'input'
  suggestion.value = null
  addModalOpen.value = true
  nextTick(() => addCatInput.value?.focus())
}

const closeAddModal = () => {
  addModalOpen.value = false
}

const suggestCategory = async () => {
  if (!addCatName.value.trim()) return
  addStep.value = 'loading'
  try {
    const data = await $fetch<{ icon: string; color: string }>('/api/suggest-category', {
      method: 'POST',
      body: { name: addCatName.value.trim() },
    })
    suggestion.value = data
    addStep.value = 'preview'
  }
  catch {
    suggestion.value = { icon: 'ShoppingBag', color: '#C4B49A' }
    addStep.value = 'preview'
  }
}

const confirmAddCategory = () => {
  if (!suggestion.value) return
  const cat: UserCategory = {
    name: addCatName.value.trim(),
    color: suggestion.value.color,
    icon: suggestion.value.icon,
  }
  saveUserCategory(cat)
  loadUserCats()
  form.category = cat.name
  addModalOpen.value = false
}

// ── Lucide icon resolver ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lucideIcon = (name: string): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (LucideIcons as any)[name] ?? LucideIcons.ShoppingBag
}

// ── Record watch ───────────────────────────────────────────────────────────────

watch(
  () => props.record,
  (r) => { if (r) Object.assign(form, r) },
  { immediate: true },
)

watch(
  () => props.visible,
  (v) => { if (v) loadUserCats() },
)

const save = () => emit('save', { ...form })
</script>

<style scoped>
.edit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(139, 94, 60, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.edit-sheet {
  position: relative;
  background: var(--surface-solid);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 24px 24px calc(32px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 430px;
  animation: slideUp 0.25s ease;
}

.edit-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

h3 {
  font-size: 14px;
  font-weight: 400;
  color: var(--text);
}

.delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #EC844C;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s;
}

.delete-btn:active {
  color: #E05252;
}

.delete-btn svg {
  width: 20px;
  height: 20px;
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
  font-size: 16px;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
}

.edit-field input:focus,
.edit-field select:focus {
  border-color: var(--accent);
}

.category-wrap {
  /* position: relative removed — panel positions relative to overlay */
}

.category-trigger {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.2s;
  text-align: left;
}

.category-trigger:focus,
.category-trigger:active {
  border-color: var(--accent);
  outline: none;
}

.category-trigger svg {
  width: 20px;
  height: 20px;
  color: var(--text-soft);
  flex-shrink: 0;
}

.category-panel {
  position: fixed;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(min(100vw, 430px) - 48px);
  background: white;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  z-index: 200;
  box-shadow: 0 8px 24px rgba(196, 98, 45, 0.12);
  overflow: hidden;
}

.category-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 55vh;
  overflow-y: auto;
}

.category-list li {
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  transition: background 0.12s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-list li:active,
.category-list li:hover {
  background: rgba(224, 122, 79, 0.08);
}

.category-list li.selected {
  color: var(--text);
  font-weight: 400;
}

.cat-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-icon-wrap svg {
  width: 14px;
  height: 14px;
}

.cat-add-item {
  color: var(--accent) !important;
  border-bottom: 1px solid var(--border);
  font-size: 13px !important;
}

.cat-add-item svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.dropdown-backdrop {
  position: absolute;
  inset: 0;
  z-index: 199;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* ── Add Category Modal ── */

.add-modal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  padding: 24px;
}

.add-modal {
  background: var(--surface-solid);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(139, 94, 60, 0.2);
}

.add-modal-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 16px;
}

.add-cat-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 16px;
  color: var(--text);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  margin-bottom: 16px;
}

.add-cat-input:focus {
  border-color: var(--accent);
}

.add-modal-actions {
  display: flex;
  gap: 8px;
}

.add-modal-cancel,
.add-modal-confirm {
  flex: 1;
  padding: 10px;
  border-radius: var(--radius-pill);
  border: none;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s;
}

.add-modal-cancel {
  background: rgba(196, 168, 130, 0.25);
  color: var(--text);
}

.add-modal-confirm {
  background: var(--accent);
  color: white;
}

.add-modal-confirm:disabled {
  opacity: 0.4;
  cursor: default;
}

.add-modal-confirm:not(:disabled):active {
  transform: scale(0.97);
}

.add-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 0 8px;
  color: var(--text-soft);
  font-size: 14px;
}

.add-spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid rgba(224, 122, 79, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.add-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0 20px;
}

.preview-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-name {
  font-size: 16px;
  color: var(--text);
  font-weight: 400;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* ── Edit actions ── */

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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
