<template>
  <div class="category-pills">
    <button
      class="pill"
      :class="{ active: !modelValue }"
      @click="$emit('update:modelValue', null)"
    >
      全部
    </button>
    <button
      v-for="cat in categories"
      :key="cat._id"
      class="pill"
      :class="{ active: modelValue === cat._id }"
      @click="$emit('update:modelValue', cat._id)"
    >
      <span v-if="cat.icon" class="pill-icon">{{ cat.icon }}</span>
      {{ cat.name }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  categories: { type: Array, default: () => [] },
  modelValue: { type: String, default: null }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.category-pills {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding: var(--spacing-sm) 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.category-pills::-webkit-scrollbar {
  display: none;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: white;
  color: var(--text-light);
  font-size: 0.875rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 36px;
}
.pill:hover {
  border-color: var(--primary);
  color: var(--primary-dark);
}
.pill.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.pill-icon {
  font-size: 1rem;
}
</style>
