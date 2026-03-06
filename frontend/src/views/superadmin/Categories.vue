<template>
  <div class="admin-layout">
    <header class="header">
      <div class="header-content">
        <h1 class="header-title">系統管理</h1>
        <nav class="nav">
          <router-link to="/superadmin" class="nav-link">總覽</router-link>
          <router-link to="/superadmin/stores" class="nav-link">店家管理</router-link>
          <router-link to="/superadmin/bookings" class="nav-link">預約管理</router-link>
          <router-link to="/superadmin/categories" class="nav-link active">分類管理</router-link>
          <button @click="handleLogout" class="nav-link logout-btn">登出</button>
        </nav>
      </div>
    </header>

    <main class="main-content container-wide">
      <div class="page-header">
        <h2 class="page-title">服務分類管理</h2>
        <button @click="openCreate" class="btn btn-primary">新增分類</button>
      </div>

      <div v-if="loading" class="loading"><div class="spinner"></div></div>

      <div v-else-if="categories.length === 0" class="empty-state">
        <div class="empty-state-icon">&#128218;</div>
        <p>尚無服務分類</p>
        <button @click="openCreate" class="btn btn-primary">新增第一個分類</button>
      </div>

      <div v-else class="category-list">
        <div v-for="cat in categories" :key="cat._id" class="category-card">
          <div class="cat-icon">{{ cat.icon || '&#128196;' }}</div>
          <div class="cat-info">
            <div class="cat-name">
              {{ cat.name }}
              <span v-if="cat.nameEn" class="cat-name-en">{{ cat.nameEn }}</span>
              <span class="badge" :class="cat.active ? 'badge-confirmed' : 'badge-cancelled'">
                {{ cat.active ? '啟用' : '停用' }}
              </span>
            </div>
            <div class="cat-meta">代碼: {{ cat.slug }} | 排序: {{ cat.sortOrder }}</div>
            <div v-if="cat.description" class="cat-desc">{{ cat.description }}</div>
          </div>
          <div class="cat-actions">
            <button @click="editCategory(cat)" class="btn btn-secondary">編輯</button>
            <button @click="deleteCategory(cat)" class="btn btn-danger">刪除</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? '編輯分類' : '新增分類' }}</h3>
          <button class="modal-close" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">分類名稱 *</label>
            <input v-model="form.name" class="form-input" placeholder="如：美髮" />
          </div>
          <div class="form-group">
            <label class="form-label">英文名稱</label>
            <input v-model="form.nameEn" class="form-input" placeholder="如：Hair" />
          </div>
          <div class="form-group">
            <label class="form-label">代碼 (slug) *</label>
            <input v-model="form.slug" class="form-input" placeholder="如：hair" />
          </div>
          <div class="form-group">
            <label class="form-label">圖示 (emoji)</label>
            <input v-model="form.icon" class="form-input" placeholder="如：💇" />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <input v-model="form.description" class="form-input" placeholder="分類說明" />
          </div>
          <div class="form-group">
            <label class="form-label">排序</label>
            <input v-model.number="form.sortOrder" type="number" class="form-input" />
          </div>
          <div v-if="editingId" class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="form.active" /> 啟用
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="saveCategory" :disabled="saving">
            {{ saving ? '儲存中...' : '儲存' }}
          </button>
        </div>
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

const categories = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingId = ref(null)
const saving = ref(false)

const form = ref({ name: '', nameEn: '', slug: '', icon: '', description: '', sortOrder: 0, active: true })

onMounted(loadCategories)

async function loadCategories() {
  loading.value = true
  try {
    const { data } = await api.get('/superadmin/categories')
    categories.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', nameEn: '', slug: '', icon: '', description: '', sortOrder: 0, active: true }
  showModal.value = true
}

function editCategory(cat) {
  editingId.value = cat._id
  form.value = { ...cat }
  showModal.value = true
}

async function saveCategory() {
  if (!form.value.name || !form.value.slug) {
    alert('請填寫名稱和代碼')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await api.put(`/superadmin/categories/${editingId.value}`, form.value)
    } else {
      await api.post('/superadmin/categories', form.value)
    }
    showModal.value = false
    await loadCategories()
  } catch (e) {
    alert(e.response?.data?.message || '操作失敗')
  } finally {
    saving.value = false
  }
}

async function deleteCategory(cat) {
  if (!confirm(`確定要刪除「${cat.name}」分類嗎？`)) return
  try {
    await api.delete(`/superadmin/categories/${cat._id}`)
    await loadCategories()
  } catch (e) {
    alert(e.response?.data?.message || '刪除失敗')
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/superadmin/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: var(--bg);
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}
.main-content {
  padding: var(--spacing-lg) var(--spacing-md);
}
.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.category-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
.cat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}
.cat-info {
  flex: 1;
}
.cat-name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.cat-name-en {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.875rem;
}
.cat-meta {
  font-size: 0.8125rem;
  color: var(--text-muted);
}
.cat-desc {
  font-size: 0.875rem;
  color: var(--text-light);
  margin-top: 2px;
}
.cat-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}
.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: inherit;
}
</style>
