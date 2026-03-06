<template>
  <span class="rating-stars">
    <span class="stars">
      <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(rating) }">&#9733;</span>
    </span>
    <span v-if="showCount && count > 0" class="rating-count">({{ count }})</span>
    <span v-if="showAverage && rating > 0" class="rating-avg">{{ rating.toFixed(1) }}</span>
  </span>
</template>

<script setup>
defineProps({
  rating: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  showCount: { type: Boolean, default: true },
  showAverage: { type: Boolean, default: false }
})
</script>

<style scoped>
.rating-stars {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.stars {
  display: inline-flex;
}
.star {
  color: var(--border);
  font-size: 0.875rem;
}
.star.filled {
  color: #f5a623;
}
.rating-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.rating-avg {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
}
</style>
