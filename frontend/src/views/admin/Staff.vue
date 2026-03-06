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
          <button @click="openProfile(staff)" class="btn btn-primary btn-sm">個人檔案</button>
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
    <!-- 個人檔案 Modal -->
    <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
      <div class="modal" style="max-width:600px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ profileStaff?.name }} - 個人檔案</h3>
          <button @click="showProfileModal = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body" style="max-height:70vh;overflow-y:auto;">
          <!-- 頭像 -->
          <div class="form-group">
            <label class="form-label">頭像</label>
            <ImageUploader v-model="profileForm.avatar" placeholder="上傳頭像" />
          </div>

          <!-- 網址代稱 -->
          <div class="form-group">
            <label class="form-label">個人頁網址代稱</label>
            <input v-model="profileForm.slug" class="form-input" placeholder="如: amy-stylist" />
            <small class="text-muted">網址將會是 /stylist/{{ profileForm.slug || 'xxx' }}</small>
          </div>

          <!-- 自我介紹 -->
          <div class="form-group">
            <label class="form-label">自我介紹</label>
            <textarea v-model="profileForm.bio" class="form-input" rows="3" maxlength="500" placeholder="介紹自己的專長和風格"></textarea>
          </div>

          <!-- 專長 -->
          <div class="form-group">
            <label class="form-label">專長標籤</label>
            <div class="tags-input-wrap">
              <div class="tags-list">
                <span v-for="(tag, i) in profileForm.specialties" :key="i" class="tag-item">
                  {{ tag }}
                  <button @click="profileForm.specialties.splice(i, 1)" class="tag-remove">&times;</button>
                </span>
              </div>
              <input
                v-model="newTag"
                class="form-input"
                placeholder="輸入標籤後按 Enter"
                @keydown.enter.prevent="addTag"
              />
            </div>
          </div>

          <!-- 社群連結 -->
          <div class="form-group">
            <label class="form-label">Instagram 連結</label>
            <input v-model="profileForm.socialLinks.instagram" class="form-input" placeholder="IG 帳號或連結" />
          </div>
          <div class="form-group">
            <label class="form-label">Facebook 連結</label>
            <input v-model="profileForm.socialLinks.facebook" class="form-input" placeholder="FB 頁面連結" />
          </div>
          <div class="form-group">
            <label class="form-label">LINE ID</label>
            <input v-model="profileForm.socialLinks.line" class="form-input" placeholder="LINE ID" />
          </div>

          <!-- 是否顯示在探索頁 -->
          <div class="form-group">
            <label class="checkbox-item">
              <input type="checkbox" v-model="profileForm.discoverable" />
              <span class="checkbox-label">在探索頁面上顯示此設計師</span>
            </label>
          </div>

          <!-- 作品集 -->
          <div class="form-group">
            <label class="form-label">作品集</label>
            <PortfolioManager
              :items="portfolioItems"
              @added="handlePortfolioAdd"
              @edit="editPortfolioItem"
              @delete="deletePortfolioItem"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showProfileModal = false">取消</button>
          <button class="btn btn-primary" @click="saveProfile" :disabled="savingProfile">
            {{ savingProfile ? '儲存中...' : '儲存檔案' }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import ImageUploader from '../../components/ImageUploader.vue'
import PortfolioManager from '../../components/PortfolioManager.vue'
import api from '../../utils/api'

const loading = ref(true)
const staffList = ref([])
const services = ref([])
const showModal = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

// Profile modal
const showProfileModal = ref(false)
const profileStaff = ref(null)
const savingProfile = ref(false)
const newTag = ref('')
const portfolioItems = ref([])
const profileForm = reactive({
  slug: '',
  avatar: '',
  bio: '',
  specialties: [],
  socialLinks: { instagram: '', facebook: '', line: '' },
  discoverable: true
})

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

// ===== 個人檔案功能 =====

async function openProfile(staff) {
  profileStaff.value = staff
  profileForm.slug = staff.slug || ''
  profileForm.avatar = staff.avatar || ''
  profileForm.bio = staff.bio || ''
  profileForm.specialties = [...(staff.specialties || [])]
  profileForm.socialLinks = { instagram: '', facebook: '', line: '', ...(staff.socialLinks || {}) }
  profileForm.discoverable = staff.discoverable !== false
  newTag.value = ''

  // 載入作品集
  try {
    const { data } = await api.get(`/admin/staff/${staff._id}/portfolio`)
    portfolioItems.value = data
  } catch (e) {
    portfolioItems.value = []
  }

  showProfileModal.value = true
}

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !profileForm.specialties.includes(tag)) {
    profileForm.specialties.push(tag)
  }
  newTag.value = ''
}

async function saveProfile() {
  savingProfile.value = true
  try {
    await api.put(`/admin/staff/${profileStaff.value._id}/profile`, {
      slug: profileForm.slug || undefined,
      avatar: profileForm.avatar,
      bio: profileForm.bio,
      specialties: profileForm.specialties,
      socialLinks: profileForm.socialLinks,
      discoverable: profileForm.discoverable
    })
    showProfileModal.value = false
    await loadData()
  } catch (e) {
    alert(e.response?.data?.message || '儲存失敗')
  } finally {
    savingProfile.value = false
  }
}

async function handlePortfolioAdd(uploadData) {
  try {
    const { data } = await api.post(`/admin/staff/${profileStaff.value._id}/portfolio`, {
      imageUrl: uploadData.url,
      thumbnailUrl: uploadData.thumbnailUrl
    })
    portfolioItems.value.push(data)
  } catch (e) {
    alert(e.response?.data?.message || '新增作品失敗')
  }
}

async function deletePortfolioItem(item) {
  if (!confirm('確定要刪除此作品嗎？')) return
  try {
    await api.delete(`/admin/staff/${profileStaff.value._id}/portfolio/${item._id}`)
    portfolioItems.value = portfolioItems.value.filter(p => p._id !== item._id)
  } catch (e) {
    alert(e.response?.data?.message || '刪除失敗')
  }
}

function editPortfolioItem(item) {
  const title = prompt('作品標題:', item.title || '')
  if (title === null) return
  api.put(`/admin/staff/${profileStaff.value._id}/portfolio/${item._id}`, { title })
    .then(({ data }) => {
      const idx = portfolioItems.value.findIndex(p => p._id === item._id)
      if (idx >= 0) portfolioItems.value[idx] = data
    })
    .catch(e => alert(e.response?.data?.message || '更新失敗'))
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

.tags-input-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
}
.tag-remove {
  background: none;
  border: none;
  color: var(--primary-dark);
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  line-height: 1;
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
