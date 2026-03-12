<template>
  <component
    v-if="iconComp"
    :is="iconComp"
    :size="size"
    color="white"
    :stroke-width="strokeWidth"
  />
  <svg
    v-else
    :width="size ?? 18"
    :height="size ?? 18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    :stroke-width="strokeWidth"
    v-html="path"
  />
</template>

<script setup lang="ts">
import * as LucideIcons from 'lucide-vue-next'
import { catPath, LUCIDE_PATHS } from '~/constants/categories'

const props = defineProps<{
  category: string
  size?: number
  strokeWidth?: number
}>()

const { getCatIcon, getCatColor } = useUserCategories()

watchEffect(() => {
  console.log('CatIcon', props.category, getCatIcon(props.category), getCatColor(props.category))
})

const iconName = computed(() => getCatIcon(props.category))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconComp = computed(() => {
  if (!iconName.value) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (LucideIcons as any)[iconName.value] ?? null
})

const path = computed(() => {
  const icon = iconName.value
  if (icon) return LUCIDE_PATHS[icon] ?? catPath(props.category)
  return catPath(props.category)
})
</script>
