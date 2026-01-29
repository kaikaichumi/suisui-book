<template>
  <AdminLayout pageTitle="今日概況" :storeName="store?.name">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else>
      <!-- 統計卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayBookings }}</div>
            <div class="stat-label">今日預約</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingBookings }}</div>
            <div class="stat-label">待確認</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">✓</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.confirmedBookings || 0 }}</div>
            <div class="stat-label">已確認</div>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">💇</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalServices }}</div>
            <div class="stat-label">服務項目</div>
          </div>
        </div>
      </div>

      <!-- 兩欄佈局 -->
      <div class="dashboard-grid">
        <!-- 顧客預約連結 -->
        <div class="card">
          <h3 class="card-title">顧客預約連結</h3>
          <p class="card-desc">分享此連結給顧客，讓他們可以線上預約</p>
          <div class="link-box">
            <code class="link-text">{{ bookingUrl }}</code>
            <button @click="copyLink" class="btn btn-sm btn-primary">複製</button>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="card">
          <h3 class="card-title">快速操作</h3>
          <p class="card-desc">常用功能快捷入口</p>
          <div class="quick-actions">
            <router-link to="/admin/bookings" class="action-btn">
              <span class="action-icon">📅</span>
              <span>查看預約</span>
            </router-link>
            <router-link to="/admin/services" class="action-btn">
              <span class="action-icon">💇</span>
              <span>管理服務</span>
            </router-link>
            <router-link to="/admin/staff" class="action-btn">
              <span class="action-icon">👤</span>
              <span>管理人員</span>
            </router-link>
            <router-link to="/admin/settings" class="action-btn">
              <span class="action-icon">⚙️</span>
              <span>店家設定</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import api from '../../utils/api'

const loading = ref(true)
const store = ref(null)
const stats = ref({
  todayBookings: 0,
  pendingBookings: 0,
  confirmedBookings: 0,
  totalServices: 0,
  totalStaff: 0
})

const bookingUrl = computed(() => {
  return `${window.location.origin}/s/${store.value?.slug}`
})

async function loadData() {
  try {
    const [storeRes, statsRes] = await Promise.all([
      api.get('/admin/me'),
      api.get('/admin/stats')
    ])
    store.value = storeRes.data
    stats.value = statsRes.data
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

function copyLink() {
  navigator.clipboard.writeText(bookingUrl.value)
  alert('連結已複製！')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-card.warning .stat-icon {
  background: #fef3c7;
}

.stat-card.success .stat-icon {
  background: #d1fae5;
}

.stat-card.info .stat-icon {
  background: #dbeafe;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: 4px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.card-desc {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
}

.link-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--bg);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.link-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--primary-dark);
  word-break: break-all;
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.75rem;
  min-height: auto;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.action-icon {
  font-size: 1.25rem;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }

  .stat-card {
    padding: var(--spacing-md);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
