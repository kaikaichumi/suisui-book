<template>
  <AdminLayout pageTitle="服務人員管理">
    <template #actions>
      <button @click="showModal = true; resetForm()" class="btn btn-primary">新增人員</button>
    </template>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else-if="staffList.length === 0" class="empty-state card">
      <div class="empty-state-icon">👤</div>
      <p>尚未新增任何服務人員</p>
      <button @click="showModal = true" class="btn btn-primary">新增第一位人員</button>
    </div>

    <div v-else class="staff-grid">
      <div
        v-for="staff in staffList"
        :key="staff._id"
        class="staff-card card"
        :class="{ inactive: !staff.active }"
      >
        <div class="staff-avatar">
          {{ staff.name.charAt(0) }}
        </div>
        <div class="staff-info">
          <div class="staff-header">
            <h3 class="staff-name">{{ staff.name }}</h3>
            <span v-if="!staff.active" class="badge badge-cancelled">已停用</span>
          </div>
          <div class="staff-services">
            <span v-if="staff.services.length === 0" class="text-muted">未設定服務項目</span>
            <span v-else class="service-tags">
              <span v-for="s in staff.services" :key="s._id" class="service-tag">
                {{ s.name }}
              </span>
            </span>
          </div>
        </div>
        <div class="staff-actions">
          <button @click="editStaff(staff)" class="btn btn-secondary btn-sm">編輯</button>
          <button
            @click="toggleActive(staff)"
            :class="staff.active ? 'btn btn-outline-danger btn-sm' : 'btn btn-outline-success btn-sm'"
          >
            {{ staff.active ? '停用' : '啟用' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 新增/編輯 Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? '編輯人員' : '新增人員' }}</h3>
          <button @click="showModal = false" class="modal-close">&times;</button>
        </div>
        <form @submit.prevent="saveStaff" class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>

          <div class="form-group">
            <label class="form-label">人員名稱 *</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="例如: Amy" required />
          </div>

          <div class="form-group">
            <label class="form-label">可提供的服務</label>
            <div class="checkbox-grid">
              <label v-for="service in services" :key="service._id" class="checkbox-item">
                <input
                  type="checkbox"
                  :value="service._id"
                  v-model="form.services"
                />
                <span class="checkbox-label">{{ service.name }}</span>
              </label>
            </div>
            <p v-if="services.length === 0" class="text-muted">請先新增服務項目</p>
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

const loading = ref(true)
const staffList = ref([])
const services = ref([])
const showModal = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  services: []
})

function resetForm() {
  form.name = ''
  form.services = []
  editingId.value = null
  formError.value = ''
}

async function loadData() {
  try {
    const [staffRes, servicesRes] = await Promise.all([
      api.get('/admin/staff'),
      api.get('/admin/services')
    ])
    staffList.value = staffRes.data
    services.value = servicesRes.data.filter(s => s.active)
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

function editStaff(staff) {
  editingId.value = staff._id
  form.name = staff.name
  form.services = staff.services.map(s => s._id)
  showModal.value = true
}

async function saveStaff() {
  saving.value = true
  formError.value = ''

  try {
    if (editingId.value) {
      await api.put(`/admin/staff/${editingId.value}`, form)
    } else {
      await api.post('/admin/staff', form)
    }
    showModal.value = false
    resetForm()
    await loadData()
  } catch (error) {
    formError.value = error.response?.data?.message || '儲存失敗'
  } finally {
    saving.value = false
  }
}

async function toggleActive(staff) {
  const action = staff.active ? '停用' : '啟用'
  if (!confirm(`確定要${action}「${staff.name}」嗎？`)) return

  try {
    await api.put(`/admin/staff/${staff._id}`, { active: !staff.active })
    await loadData()
  } catch (error) {
    alert(error.response?.data?.message || '操作失敗')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

.staff-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.staff-card.inactive {
  opacity: 0.6;
}

.staff-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  flex-shrink: 0;
}

.staff-info {
  flex: 1;
  min-width: 0;
}

.staff-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.staff-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.staff-services {
  margin-top: var(--spacing-xs);
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.service-tag {
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
}

.staff-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex-shrink: 0;
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

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-sm);
  max-height: 200px;
  overflow-y: auto;
  padding: var(--spacing-sm);
  background: var(--bg);
  border-radius: var(--radius-md);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
}

.checkbox-item input {
  width: 16px;
  height: 16px;
}

.checkbox-label {
  font-size: 0.875rem;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .staff-grid {
    grid-template-columns: 1fr;
  }

  .staff-actions {
    flex-direction: row;
  }
}
</style>
