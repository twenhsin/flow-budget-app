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
              <div class="category-new-row">
                <input
                  ref="newCatInput"
                  v-model="newCategoryText"
                  type="text"
                  placeholder="新增類別"
                  autocomplete="off"
                  @keydown.enter.prevent="addNewCategory"
                >
                <button type="button" class="category-add-btn" @click="addNewCategory">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              <ul class="category-list">
                <li
                  v-for="cat in allCategories"
                  :key="cat"
                  :class="{ selected: form.category === cat }"
                  @click="selectCategory(cat)"
                >
                  {{ cat }}
                </li>
              </ul>
            </div>
          </Transition>
        </div>

        <div class="edit-actions">
          <button class="edit-cancel-btn" @click="$emit('close')">取消</button>
          <button class="edit-save-btn" @click="save">儲存</button>
        </div>
      </div>

      <!-- backdrop to close dropdown -->
      <div v-if="dropdownOpen" class="dropdown-backdrop" @click="dropdownOpen = false" />
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
  category: '餐飲',
})

const customCategories = useState<string[]>('customCategories', () => [])
const dropdownOpen = ref(false)
const newCategoryText = ref('')
const newCatInput = ref<HTMLInputElement | null>(null)

const allCategories = computed(() => [
  ...CATEGORIES,
  ...customCategories.value.filter(c => !CATEGORIES.includes(c)),
])

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    nextTick(() => newCatInput.value?.focus())
  }
}

const selectCategory = (cat: string) => {
  form.category = cat
  dropdownOpen.value = false
}

const addNewCategory = () => {
  const cat = newCategoryText.value.trim()
  if (!cat) return
  if (!allCategories.value.includes(cat)) {
    customCategories.value.push(cat)
  }
  form.category = cat
  newCategoryText.value = ''
  dropdownOpen.value = false
}

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

.category-wrap {
  position: relative;
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
  width: 16px;
  height: 16px;
  color: var(--text-soft);
  flex-shrink: 0;
}

.category-panel {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  z-index: 200;
  box-shadow: 0 8px 24px rgba(196, 98, 45, 0.12);
  overflow: hidden;
}

.category-new-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.category-new-row input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 14px;
  color: var(--text);
  outline: none;
}

.category-new-row input::placeholder {
  color: var(--text-soft);
}

.category-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.category-add-btn:active {
  opacity: 0.75;
}

.category-add-btn svg {
  width: 14px;
  height: 14px;
}

.category-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 180px;
  overflow-y: auto;
}

.category-list li {
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  transition: background 0.12s;
}

.category-list li:active,
.category-list li:hover {
  background: rgba(224, 122, 79, 0.08);
}

.category-list li.selected {
  color: var(--accent);
  font-weight: 400;
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
