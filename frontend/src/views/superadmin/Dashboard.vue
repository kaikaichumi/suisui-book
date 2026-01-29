<template>
  <div class="admin-layout">
    <header class="header">
      <div class="header-content">
        <h1 class="header-title">系統管理</h1>
        <nav class="nav">
          <router-link to="/superadmin" class="nav-link" :class="{ active: $route.path === '/superadmin' }">
            總覽
          </router-link>
          <router-link to="/superadmin/stores" class="nav-link" :class="{ active: $route.path === '/superadmin/stores' }">
            店家管理
          </router-link>
          <router-link to="/superadmin/bookings" class="nav-link" :class="{ active: $route.path === '/superadmin/bookings' }">
            預約管理
          </router-link>
          <button @click="handleLogout" class="nav-link logout-btn">登出</button>
        </nav>
      </div>
    </header>

    <main class="main-content container-wide">
      <h2 class="page-title">系統總覽</h2>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.activeStores }}</div>
          <div class="stat-label">營運店家</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.todayBookings }}</div>
          <div class="stat-label">今日預約</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.pendingBookings }}</div>
          <div class="stat-label">待確認預約</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalBookings }}</div>
          <div class="stat-label">總預約數</div>
        </div>
      </div>

      <div class="quick-actions">
        <h3 class="section-title">快速操作</h3>
        <div class="action-buttons">
          <router-link to="/superadmin/stores" class="btn btn-primary">
            管理店家
          </router-link>
          <router-link to="/superadmin/bookings" class="btn btn-secondary">
            查看所有預約
          </router-link>
        </div>
      </div>
    </main>
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
const stats = ref({
  totalStores: 0,
  activeStores: 0,
  totalBookings: 0,
  todayBookings: 0,
  pendingBookings: 0
})

async function loadStats() {
  try {
    const response = await api.get('/superadmin/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/superadmin/login')
}

onMounted(() => {
  loadStats()
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.quick-actions {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
}

.logout-btn:hover {
  color: var(--error);
}
</style>
