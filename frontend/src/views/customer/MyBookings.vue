<template>
  <div class="my-bookings-page">
    <!-- 頂部導航 -->
    <header class="header">
      <div class="header-content container">
        <router-link :to="`/s/${slug}`" class="back-btn">&larr;</router-link>
        <h1 class="header-title">我的預約</h1>
        <div style="width: 40px;"></div>
      </div>
    </header>

    <main class="container page-content">
      <!-- 查詢表單 -->
      <div v-if="!searched" class="search-form card">
        <h2 class="section-title">查詢預約</h2>
        <p class="hint">請輸入您預約時使用的手機號碼</p>
        <form @submit.prevent="searchBookings">
          <div class="form-group">
            <input
              v-model="phone"
              type="tel"
              class="form-input"
              placeholder="手機號碼"
              required
            />
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? '查詢中...' : '查詢' }}
          </button>
        </form>
      </div>

      <!-- 已登入用戶載入中 -->
      <div v-if="searched && loading && authStore.isCustomer" class="loading">
        <div class="spinner"></div>
      </div>

      <!-- 查詢結果 -->
      <div v-else>
        <div class="result-header">
          <span>{{ authStore.isCustomer ? (authStore.user?.name || '我') : phone }} 的預約紀錄</span>
          <button v-if="!authStore.isCustomer" @click="resetSearch" class="btn btn-secondary btn-sm">重新查詢</button>
        </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="bookings.length === 0" class="empty-state card">
          <div class="empty-state-icon">📅</div>
          <p>找不到預約紀錄</p>
          <router-link :to="`/s/${slug}/booking`" class="btn btn-primary">
            立即預約
          </router-link>
        </div>

        <div v-else class="bookings-list">
          <div v-for="booking in bookings" :key="booking._id" class="booking-card card">
            <div class="booking-header">
              <div class="booking-date">
                <span class="date">{{ formatDate(booking.date) }}</span>
                <span class="time">{{ booking.startTime }} - {{ booking.endTime }}</span>
              </div>
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
                <span class="label">費用:</span>
                <span class="price">{{ formatPrice(booking.serviceId?.price) }}</span>
              </div>
            </div>

            <div v-if="canCancel(booking)" class="booking-actions">
              <button @click="cancelBooking(booking)" class="btn btn-danger btn-block">
                取消預約
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../utils/api'
import { useAuthStore } from '../../stores/auth'
import { formatPrice, formatFullDate } from '../../utils/format'

const route = useRoute()
const slug = route.params.slug
const authStore = useAuthStore()

const phone = ref('')
const searched = ref(false)
const loading = ref(false)
const bookings = ref([])

onMounted(() => {
  // 已登入顧客自動查詢
  if (authStore.isCustomer) {
    searched.value = true
    searchBookings()
  }
})

async function searchBookings() {
  loading.value = true
  searched.value = true

  try {
    const params = {}
    if (!authStore.isCustomer) {
      params.phone = phone.value
    }
    const response = await api.get(`/stores/${slug}/my-bookings`, { params })
    bookings.value = response.data
  } catch (error) {
    console.error('Failed to load bookings:', error)
    bookings.value = []
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searched.value = false
  bookings.value = []
}

async function cancelBooking(booking) {
  if (!confirm('確定要取消此預約嗎？')) return

  try {
    await api.post(`/stores/${slug}/bookings/${booking._id}/cancel`, {
      phone: phone.value
    })
    // 重新載入
    await searchBookings()
    alert('預約已取消')
  } catch (error) {
    alert(error.response?.data?.message || '取消失敗')
  }
}

function canCancel(booking) {
  if (booking.status === 'cancelled' || booking.status === 'completed') {
    return false
  }
  // 只能取消未來的預約
  const bookingDate = new Date(booking.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return bookingDate >= today
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${year}/${month}/${day} (${weekday})`
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
</script>

<style scoped>
.my-bookings-page {
  min-height: 100vh;
  background: var(--bg);
}

.header {
  background: white;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  max-width: 900px;
  margin: 0 auto;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg);
  border-radius: var(--radius-md);
  font-size: 1.25rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
}

.header-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.page-content {
  padding: var(--spacing-lg) var(--spacing-md);
  max-width: 900px;
  margin: 0 auto;
}

.search-form {
  max-width: 400px;
  margin: 0 auto;
}

.hint {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.875rem;
  min-height: auto;
}

.bookings-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-md);
}

.booking-card {
  padding: var(--spacing-md);
  transition: box-shadow 0.2s;
}

.booking-card:hover {
  box-shadow: var(--shadow-md);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border);
}

.booking-date .date {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.booking-date .time {
  color: var(--primary-dark);
  font-size: 1.25rem;
  font-weight: 600;
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
  min-width: 45px;
}

.detail-row .price {
  font-weight: 600;
  color: var(--primary-dark);
}

.booking-actions {
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border);
}

.empty-state {
  max-width: 400px;
  margin: 0 auto;
}

/* Desktop enhancements */
@media (min-width: 768px) {
  .page-content {
    padding: var(--spacing-xl);
  }

  .header-title {
    font-size: 1.25rem;
  }

  .booking-card {
    padding: var(--spacing-lg);
  }

  .booking-date .time {
    font-size: 1.5rem;
  }

  .detail-row {
    font-size: 1rem;
  }

  .detail-row .label {
    min-width: 60px;
  }
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .bookings-list {
    grid-template-columns: 1fr;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
</style>
