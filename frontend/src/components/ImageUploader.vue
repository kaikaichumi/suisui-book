<template>
  <div class="image-uploader">
    <div v-if="previewUrl" class="preview">
      <img :src="previewUrl" alt="預覽" />
      <button class="remove-btn" @click="removeImage">&times;</button>
    </div>
    <label v-else class="upload-area" :class="{ uploading }">
      <input type="file" accept="image/*" @change="handleFileSelect" :disabled="uploading" />
      <div v-if="uploading" class="upload-progress">
        <div class="spinner" style="width:24px;height:24px;border-width:2px;"></div>
        <span>上傳中...</span>
      </div>
      <div v-else class="upload-placeholder">
        <span class="upload-icon">+</span>
        <span>{{ placeholder }}</span>
      </div>
    </label>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '../utils/api'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '上傳圖片' }
})

const emit = defineEmits(['update:modelValue', 'uploaded'])

const uploading = ref(false)
const previewUrl = computed(() => props.modelValue)

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    emit('update:modelValue', data.url)
    emit('uploaded', data)
  } catch (err) {
    alert(err.response?.data?.message || '上傳失敗')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

function removeImage() {
  emit('update:modelValue', '')
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}
.preview {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  aspect-ratio: 1;
  max-width: 200px;
}
.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  font-size: 1.125rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: border-color 0.2s;
  aspect-ratio: 1;
  max-width: 200px;
}
.upload-area:hover {
  border-color: var(--primary);
}
.upload-area.uploading {
  pointer-events: none;
  opacity: 0.7;
}
.upload-area input[type="file"] {
  display: none;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-muted);
  font-size: 0.875rem;
}
.upload-icon {
  font-size: 2rem;
  color: var(--primary);
}
.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
