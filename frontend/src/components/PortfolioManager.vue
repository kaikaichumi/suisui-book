<template>
  <div class="portfolio-manager">
    <div class="portfolio-grid">
      <div v-for="item in items" :key="item._id" class="portfolio-item">
        <img :src="item.thumbnailUrl || item.imageUrl" :alt="item.title" loading="lazy" />
        <div class="item-overlay">
          <button class="overlay-btn" @click="$emit('edit', item)" title="編輯">&#9998;</button>
          <button class="overlay-btn danger" @click="$emit('delete', item)" title="刪除">&times;</button>
        </div>
        <div v-if="item.title" class="item-title">{{ item.title }}</div>
      </div>

      <!-- 新增按鈕 -->
      <label class="portfolio-add">
        <input type="file" accept="image/*" @change="handleUpload" :disabled="uploading" />
        <div v-if="uploading" class="add-content">
          <div class="spinner" style="width:24px;height:24px;border-width:2px;"></div>
        </div>
        <div v-else class="add-content">
          <span class="add-icon">+</span>
          <span>新增作品</span>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../utils/api'

defineProps({
  items: { type: Array, default: () => [] }
})

const emit = defineEmits(['edit', 'delete', 'added'])
const uploading = ref(false)

async function handleUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    emit('added', data)
  } catch (err) {
    alert(err.response?.data?.message || '上傳失敗')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}
</script>

<style scoped>
.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}
.portfolio-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg);
}
.portfolio-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity 0.2s;
}
.portfolio-item:hover .item-overlay {
  opacity: 1;
}
.overlay-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: white;
  color: var(--text);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlay-btn.danger {
  background: var(--error);
  color: white;
}
.item-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 8px;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.portfolio-add {
  aspect-ratio: 1;
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}
.portfolio-add:hover {
  border-color: var(--primary);
}
.portfolio-add input[type="file"] {
  display: none;
}
.add-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.8125rem;
}
.add-icon {
  font-size: 1.5rem;
  color: var(--primary);
}
@media (min-width: 768px) {
  .portfolio-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
