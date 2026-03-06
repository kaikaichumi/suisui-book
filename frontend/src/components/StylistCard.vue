<template>
  <div class="stylist-card" @click="$emit('click')">
    <div class="stylist-header">
      <div class="stylist-avatar">
        <img v-if="stylist.avatar" :src="stylist.avatar" :alt="stylist.name" />
        <span v-else class="avatar-placeholder">{{ stylist.name?.charAt(0) }}</span>
      </div>
      <div class="stylist-info">
        <h3 class="stylist-name">{{ stylist.name }}</h3>
        <p v-if="stylist.storeId" class="stylist-store">{{ stylist.storeId.name }}</p>
        <RatingStars :rating="stylist.rating?.average || 0" :count="stylist.rating?.count || 0" />
      </div>
    </div>

    <div v-if="stylist.specialties?.length" class="stylist-tags">
      <span v-for="tag in stylist.specialties.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
    </div>

    <div v-if="stylist.portfolioPreview?.length" class="portfolio-preview">
      <div
        v-for="(img, i) in stylist.portfolioPreview"
        :key="i"
        class="preview-img"
      >
        <img :src="img.url || img.imageUrl" :alt="img.title || '作品'" loading="lazy" />
      </div>
    </div>

    <div v-if="stylist.distance" class="stylist-distance">
      {{ formatDistance(stylist.distance) }}
    </div>
  </div>
</template>

<script setup>
import RatingStars from './RatingStars.vue'

defineProps({
  stylist: { type: Object, required: true }
})
defineEmits(['click'])

function formatDistance(meters) {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}
</script>

<style scoped>
.stylist-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.stylist-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
.stylist-header {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}
.stylist-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--primary-light);
}
.stylist-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-dark);
}
.stylist-info {
  flex: 1;
  min-width: 0;
}
.stylist-name {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 2px;
}
.stylist-store {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.stylist-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-sm);
}
.tag {
  padding: 2px 8px;
  font-size: 0.75rem;
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: var(--radius-full);
}
.portfolio-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.preview-img {
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--bg);
}
.preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.stylist-distance {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: 2px 8px;
  font-size: 0.75rem;
  background: rgba(0,0,0,0.6);
  color: white;
  border-radius: var(--radius-full);
}
</style>
