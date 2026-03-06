<template>
  <AdminLayout pageTitle="服務項目管理">
    <template #actions>
      <button @click="showModal = true; resetForm()" class="btn btn-primary">新增服務</button>
    </template>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="services.length === 0" class="empty-state card">
      <div class="empty-state-icon">💇</div>
      <p>尚未新增任何服務</p>
      <button @click="showModal = true" class="btn btn-primary">新增第一個服務</button>
    </div>

    <div v-else class="services-grid">
      <div
        v-for="service in services"
        :key="service._id"
        class="service-card card"
        :class="{ inactive: !service.active }"
      >
        <div class="service-header">
          <h3 class="service-name">{{ service.name }}</h3>
          <span v-if="!service.active" class="badge badge-cancelled">已停用</span>
        </div>
        <div class="service-meta">
          <span class="meta-item">
            <span class="meta-icon">⏱</span>
            {{ service.duration }} 分鐘
          </span>
          <span class="meta-item price">
            <span class="meta-icon">💰</span>
            {{ formatPrice(service) }}
          </span>
        </div>
        <p v-if="service.description" class="service-desc">{{ service.description }}</p>
        <div class="service-actions">
          <button @click="editService(service)" class="btn btn-secondary btn-sm">編輯</button>
          <button
            @click="toggleActive(service)"
            :class="service.active ? 'btn btn-outline-danger btn-sm' : 'btn btn-outline-success btn-sm'"
          >
            {{ service.active ? '停用' : '啟用' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 新增/編輯 Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? '編輯服務' : '新增服務' }}</h3>
          <button @click="showModal = false" class="modal-close">&times;</button>
        </div>
        <form @submit.prevent="saveService" class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>

          <div class="form-group">
            <label class="form-label">服務名稱 *</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="例如: 洗剪吹" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">價格 *</label>
              <input v-model.number="form.priceMin" type="number" class="form-input" placeholder="例如: 500" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">最高價格 <span class="hint">（選填，不填為固定價格）</span></label>
              <input v-model.number="form.priceMax" type="number" class="form-input" placeholder="例如: 1500" min="0" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">服務時長 *</label>
            <select v-model.number="form.duration" class="form-input" required>
              <option :value="30">30 分鐘</option>
              <option :value="60">1 小時</option>
              <option :value="90">1.5 小時</option>
              <option :value="120">2 小時</option>
              <option :value="150">2.5 小時</option>
              <option :value="180">3 小時</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">服務說明</label>
            <textarea v-model="form.description" class="form-input" rows="3" placeholder="選填"></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" @click="showModal = false" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? '儲存中...' : '儲存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import api from '../../utils/api'
import { formatPrice } from '../../utils/format'

const loading = ref(true)
const services = ref([])
const showModal = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  priceMin: '',
  priceMax: '',
  duration: 60,
  description: ''
})

function resetForm() {
  form.name = ''
  form.priceMin = ''
  form.priceMax = ''
  form.duration = 60
  form.description = ''
  editingId.value = null
  formError.value = ''
}

async function loadServices() {
  try {
    const response = await api.get('/admin/services')
    services.value = response.data
  } catch (error) {
    console.error('Failed to load services:', error)
  } finally {
    loading.value = false
  }
}

function editService(service) {
  editingId.value = service._id
  form.name = service.name
  form.priceMin = service.priceMin
  form.priceMax = service.priceMax || ''
  form.duration = service.duration
  form.description = service.description || ''
  showModal.value = true
}

async function saveService() {
  saving.value = true
  formError.value = ''

  try {
    if (editingId.value) {
      await api.put(`/admin/services/${editingId.value}`, form)
    } else {
      await api.post('/admin/services', form)
    }
    showModal.value = false
    resetForm()
    await loadServices()
  } catch (error) {
    formError.value = error.response?.data?.message || '儲存失敗'
  } finally {
    saving.value = false
  }
}

async function toggleActive(service) {
  const action = service.active ? '停用' : '啟用'
  if (!confirm(`確定要${action}「${service.name}」嗎？`)) return

  try {
    await api.put(`/admin/services/${service._id}`, { active: !service.active })
    await loadServices()
  } catch (error) {
    alert(error.response?.data?.message || '操作失敗')
  }
}

onMounted(() => {
  loadServices()
})
</script>

<style scoped>
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.service-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.service-card.inactive {
  opacity: 0.6;
}

.service-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.service-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.service-meta {
  display: flex;
  gap: var(--spacing-md);
  color: var(--text-muted);
  font-size: 0.875rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.price {
  color: var(--primary-dark);
  font-weight: 600;
}

.meta-icon {
  font-size: 0.875rem;
}

.service-desc {
  font-size: 0.875rem;
  color: var(--text-light);
  margin: 0;
  line-height: 1.5;
}

.service-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: auto;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.75rem;
  min-height: auto;
}

.btn-outline-danger {
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.btn-outline-danger:hover {
  background: var(--danger);
  color: white;
}

.btn-outline-success {
  background: transparent;
  color: var(--success);
  border: 1px solid var(--success);
}

.btn-outline-success:hover {
  background: var(--success);
  color: white;
}

.hint {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

@media (max-width: 768px) {
  .services-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
