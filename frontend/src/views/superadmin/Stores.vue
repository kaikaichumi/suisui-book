<template>
  <div class="admin-layout">
    <header class="header">
      <div class="header-content">
        <h1 class="header-title">系統管理</h1>
        <nav class="nav">
          <router-link to="/superadmin" class="nav-link">總覽</router-link>
          <router-link to="/superadmin/stores" class="nav-link active">店家管理</router-link>
          <router-link to="/superadmin/bookings" class="nav-link">預約管理</router-link>
          <button @click="handleLogout" class="nav-link logout-btn">登出</button>
        </nav>
      </div>
    </header>

    <main class="main-content container-wide">
      <div class="page-header">
        <h2 class="page-title">店家管理</h2>
        <button @click="showCreateModal = true" class="btn btn-primary">新增店家</button>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else-if="stores.length === 0" class="empty-state">
        <div class="empty-state-icon">🏪</div>
        <p>尚無店家資料</p>
        <button @click="showCreateModal = true" class="btn btn-primary">新增第一個店家</button>
      </div>

      <div v-else class="stores-list">
        <div v-for="store in stores" :key="store._id" class="store-card">
          <div class="store-info">
            <div class="store-name">
              {{ store.name }}
              <span class="badge" :class="store.active ? 'badge-confirmed' : 'badge-cancelled'">
                {{ store.active ? '營運中' : '已停用' }}
              </span>
            </div>
            <div class="store-slug">/s/{{ store.slug }}</div>
            <div class="store-meta">
              {{ store.address || '未設定地址' }} | {{ store.phone || '未設定電話' }}
            </div>
          </div>
          <div class="store-actions">
            <button @click="editStore(store)" class="btn btn-secondary">編輯</button>
            <button @click="resetPassword(store)" class="btn btn-secondary">重設密碼</button>
            <button
              @click="toggleStoreStatus(store)"
              :class="store.active ? 'btn btn-danger' : 'btn btn-primary'"
            >
              {{ store.active ? '停用' : '啟用' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 新增店家 Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">新增店家</h3>
          <button @click="showCreateModal = false" class="modal-close">&times;</button>
        </div>
        <form @submit.prevent="createStore" class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>

          <div class="form-group">
            <label class="form-label">網址識別碼 *</label>
            <input v-model="newStore.slug" type="text" class="form-input" placeholder="例如: beauty-salon" required />
            <small class="form-hint">顧客預約網址將會是 /s/{{ newStore.slug || 'xxx' }}</small>
          </div>

          <div class="form-group">
            <label class="form-label">店家名稱 *</label>
            <input v-model="newStore.name" type="text" class="form-input" placeholder="例如: 美麗髮廊" required />
          </div>

          <div class="form-group">
            <label class="form-label">登入密碼 *</label>
            <input v-model="newStore.password" type="password" class="form-input" placeholder="至少 6 個字元" required />
          </div>

          <div class="form-group">
            <label class="form-label">地址</label>
            <input v-model="newStore.address" type="text" class="form-input" placeholder="店家地址" />
          </div>

          <div class="form-group">
            <label class="form-label">電話</label>
            <input v-model="newStore.phone" type="text" class="form-input" placeholder="聯絡電話" />
          </div>

          <div class="modal-footer">
            <button type="button" @click="showCreateModal = false" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="creating">
              {{ creating ? '建立中...' : '建立店家' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 編輯店家 Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">編輯店家</h3>
          <button @click="showEditModal = false" class="modal-close">&times;</button>
        </div>
        <form @submit.prevent="updateStore" class="modal-body">
          <div v-if="formError" class="alert alert-error">{{ formError }}</div>

          <div class="form-group">
            <label class="form-label">網址識別碼</label>
            <input :value="editingStore.slug" type="text" class="form-input" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">店家名稱 *</label>
            <input v-model="editingStore.name" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">地址</label>
            <input v-model="editingStore.address" type="text" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">電話</label>
            <input v-model="editingStore.phone" type="text" class="form-input" />
          </div>

          <div class="modal-footer">
            <button type="button" @click="showEditModal = false" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="updating">
              {{ updating ? '更新中...' : '更新' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 重設密碼 Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">重設密碼</h3>
          <button @click="showPasswordModal = false" class="modal-close">&times;</button>
        </div>
        <form @submit.prevent="confirmResetPassword" class="modal-body">
          <p>正在為 <strong>{{ passwordStore?.name }}</strong> 重設密碼</p>

          <div class="form-group">
            <label class="form-label">新密碼 *</label>
            <input v-model="newPassword" type="password" class="form-input" placeholder="至少 6 個字元" required />
          </div>

          <div class="modal-footer">
            <button type="button" @click="showPasswordModal = false" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="resetting">
              {{ resetting ? '重設中...' : '確認重設' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const stores = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const formError = ref('')

// 新增店家
const newStore = ref({ slug: '', name: '', password: '', address: '', phone: '' })
const creating = ref(false)

// 編輯店家
const editingStore = ref(null)
const updating = ref(false)

// 重設密碼
const passwordStore = ref(null)
const newPassword = ref('')
const resetting = ref(false)

async function loadStores() {
  try {
    const response = await api.get('/superadmin/stores')
    stores.value = response.data
  } catch (error) {
    console.error('Failed to load stores:', error)
  } finally {
    loading.value = false
  }
}

async function createStore() {
  creating.value = true
  formError.value = ''

  try {
    await api.post('/superadmin/stores', newStore.value)
    showCreateModal.value = false
    newStore.value = { slug: '', name: '', password: '', address: '', phone: '' }
    await loadStores()
  } catch (error) {
    formError.value = error.response?.data?.message || '建立失敗'
  } finally {
    creating.value = false
  }
}

function editStore(store) {
  editingStore.value = { ...store }
  showEditModal.value = true
}

async function updateStore() {
  updating.value = true
  formError.value = ''

  try {
    await api.put(`/superadmin/stores/${editingStore.value._id}`, {
      name: editingStore.value.name,
      address: editingStore.value.address,
      phone: editingStore.value.phone
    })
    showEditModal.value = false
    await loadStores()
  } catch (error) {
    formError.value = error.response?.data?.message || '更新失敗'
  } finally {
    updating.value = false
  }
}

function resetPassword(store) {
  passwordStore.value = store
  newPassword.value = ''
  showPasswordModal.value = true
}

async function confirmResetPassword() {
  resetting.value = true

  try {
    await api.post(`/superadmin/stores/${passwordStore.value._id}/reset-password`, {
      password: newPassword.value
    })
    showPasswordModal.value = false
    alert('密碼重設成功')
  } catch (error) {
    alert(error.response?.data?.message || '重設失敗')
  } finally {
    resetting.value = false
  }
}

async function toggleStoreStatus(store) {
  const action = store.active ? '停用' : '啟用'
  if (!confirm(`確定要${action}「${store.name}」嗎？`)) return

  try {
    await api.put(`/superadmin/stores/${store._id}`, { active: !store.active })
    await loadStores()
  } catch (error) {
    alert(error.response?.data?.message || '操作失敗')
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/superadmin/login')
}

onMounted(() => {
  loadStores()
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: var(--bg);
}

.main-content {
  padding: var(--spacing-lg) var(--spacing-md);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.stores-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.store-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.store-name {
  font-size: 1.125rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.store-slug {
  color: var(--primary-dark);
  font-family: monospace;
  font-size: 0.875rem;
}

.store-meta {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.store-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.form-hint {
  display: block;
  margin-top: var(--spacing-xs);
  color: var(--text-muted);
  font-size: 0.875rem;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
}
</style>
