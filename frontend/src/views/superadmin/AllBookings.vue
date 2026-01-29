<template>
  <div class="admin-layout">
    <header class="header">
      <div class="header-content">
        <h1 class="header-title">系統管理</h1>
        <nav class="nav">
          <router-link to="/superadmin" class="nav-link">總覽</router-link>
          <router-link to="/superadmin/stores" class="nav-link">店家管理</router-link>
          <router-link to="/superadmin/bookings" class="nav-link active">預約管理</router-link>
          <button @click="handleLogout" class="nav-link logout-btn">登出</button>
        </nav>
      </div>
    </header>

    <main class="main-content container-wide">
      <h2 class="page-title">全域預約管理</h2>

      <!-- 篩選器 -->
      <div class="filters card">
        <div class="filter-row">
          <div class="filter-item">
            <label class="form-label">店家</label>
            <select v-model="filters.storeId" class="form-input" @change="loadBookings">
              <option value="">全部店家</option>
              <option v-for="store in stores" :key="store._id" :value="store._id">
                {{ store.name }}
              </option>
            </select>
          </div>
          <div class="filter-item">
            <label class="form-label">日期</label>
            <input v-model="filters.date" type="date" class="form-input" @change="loadBookings" />
          </div>
          <div class="filter-item">
            <label class="form-label">狀態</label>
            <select v-model="filters.status" class="form-input" @change="loadBookings">
              <option value="">全部狀態</option>
              <option value="pending">待確認</option>
              <option value="confirmed">已確認</option>
              <option value="cancelled">已取消</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else-if="bookings.length === 0" class="empty-state card">
        <div class="empty-state-icon">📅</div>
        <p>沒有符合條件的預約</p>
      </div>

      <div v-else class="bookings-list">
        <div v-for="booking in bookings" :key="booking._id" class="booking-card card">
          <div class="booking-header">
            <span class="store-name">{{ booking.storeId?.name }}</span>
            <span class="badge" :class="getStatusClass(booking.status)">
              {{ getStatusText(booking.status) }}
            </span>
          </div>
          <div class="booking-details">
            <div class="detail-row">
              <span class="label">服務:</span>
              <span>{{ booking.serviceId?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">人員:</span>
              <span>{{ booking.staffId?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">時間:</span>
              <span>{{ formatDate(booking.date) }} {{ booking.startTime }}-{{ booking.endTime }}</span>
            </div>
            <div class="detail-row">
              <span class="label">顧客:</span>
              <span>{{ booking.customerName }} / {{ booking.customerPhone }}</span>
            </div>
          </div>
          <div class="booking-actions">
            <button
              v-if="booking.status === 'pending'"
              @click="updateStatus(booking, 'confirmed')"
              class="btn btn-primary"
            >
              確認
            </button>
            <button
              v-if="booking.status !== 'cancelled'"
              @click="updateStatus(booking, 'cancelled')"
              class="btn btn-danger"
            >
              取消
            </button>
          </div>
        </div>
      </div>

      <!-- 分頁 -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="btn btn-secondary"
        >
          上一頁
        </button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.pages }}</span>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.pages"
          class="btn btn-secondary"
        >
          下一頁
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const stores = ref([])
const bookings = ref([])
const filters = reactive({
  storeId: '',
  date: '',
  status: ''
})
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

async function loadStores() {
  try {
    const response = await api.get('/superadmin/stores')
    stores.value = response.data
  } catch (error) {
    console.error('Failed to load stores:', error)
  }
}

async function loadBookings() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (filters.storeId) params.storeId = filters.storeId
    if (filters.date) params.date = filters.date
    if (filters.status) params.status = filters.status

    const response = await api.get('/superadmin/bookings', { params })
    // API 直接回傳陣列，不是 { bookings, pagination } 物件
    bookings.value = Array.isArray(response.data) ? response.data : (response.data.bookings || [])
    if (response.data.pagination) {
      Object.assign(pagination, response.data.pagination)
    }
  } catch (error) {
    console.error('Failed to load bookings:', error)
  } finally {
    loading.value = false
  }
}

async function updateStatus(booking, status) {
  const action = status === 'confirmed' ? '確認' : '取消'
  if (!confirm(`確定要${action}此預約嗎？`)) return

  try {
    await api.put(`/superadmin/bookings/${booking._id}`, { status })
    await loadBookings()
  } catch (error) {
    alert(error.response?.data?.message || '操作失敗')
  }
}

function changePage(page) {
  pagination.page = page
  loadBookings()
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getStatusClass(status) {
  const classes = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    cancelled: 'badge-cancelled',
    completed: 'badge-completed'
  }
  return classes[status] || ''
}

function getStatusText(status) {
  const texts = {
    pending: '待確認',
    confirmed: '已確認',
    cancelled: '已取消',
    completed: '已完成'
  }
  return texts[status] || status
}

function handleLogout() {
  authStore.logout()
  router.push('/superadmin/login')
}

onMounted(() => {
  loadStores()
  loadBookings()
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

.filters {
  margin-bottom: var(--spacing-lg);
}

.filter-row {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 150px;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.booking-card {
  padding: var(--spacing-md);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.store-name {
  font-weight: 600;
  color: var(--primary-dark);
}

.booking-details {
  margin-bottom: var(--spacing-md);
}

.detail-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
}

.detail-row .label {
  color: var(--text-muted);
  min-width: 50px;
}

.booking-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.page-info {
  color: var(--text-muted);
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
}
</style>
