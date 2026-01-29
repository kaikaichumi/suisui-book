<template>
  <div class="admin-layout">
    <!-- 桌面側邊欄 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="sidebar-title">{{ storeName || 'SuiSui Book' }}</h1>
        <p class="sidebar-subtitle">店家管理後台</p>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/admin" class="sidebar-link" :class="{ active: currentPath === '/admin' }">
          <span class="sidebar-icon">📊</span>
          <span>總覽</span>
        </router-link>
        <router-link to="/admin/services" class="sidebar-link" :class="{ active: currentPath === '/admin/services' }">
          <span class="sidebar-icon">💇</span>
          <span>服務管理</span>
        </router-link>
        <router-link to="/admin/staff" class="sidebar-link" :class="{ active: currentPath === '/admin/staff' }">
          <span class="sidebar-icon">👤</span>
          <span>人員管理</span>
        </router-link>
        <router-link to="/admin/bookings" class="sidebar-link" :class="{ active: currentPath === '/admin/bookings' }">
          <span class="sidebar-icon">📅</span>
          <span>預約管理</span>
        </router-link>
        <router-link to="/admin/settings" class="sidebar-link" :class="{ active: currentPath === '/admin/settings' }">
          <span class="sidebar-icon">⚙️</span>
          <span>店家設定</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <span class="sidebar-icon">🚪</span>
          <span>登出</span>
        </button>
      </div>
    </aside>

    <!-- 主內容區 -->
    <div class="main-wrapper">
      <!-- 手機頂部欄 -->
      <header class="mobile-header">
        <h1 class="mobile-title">{{ pageTitle }}</h1>
      </header>

      <!-- 內容 -->
      <main class="main-content">
        <div class="content-header" v-if="pageTitle">
          <h2 class="page-title">{{ pageTitle }}</h2>
          <slot name="actions"></slot>
        </div>
        <slot></slot>
      </main>
    </div>

    <!-- 手機底部導航 -->
    <nav class="bottom-nav">
      <router-link to="/admin" class="bottom-nav-item" :class="{ active: currentPath === '/admin' }">
        <span class="bottom-nav-icon">📊</span>
        <span>總覽</span>
      </router-link>
      <router-link to="/admin/services" class="bottom-nav-item" :class="{ active: currentPath === '/admin/services' }">
        <span class="bottom-nav-icon">💇</span>
        <span>服務</span>
      </router-link>
      <router-link to="/admin/staff" class="bottom-nav-item" :class="{ active: currentPath === '/admin/staff' }">
        <span class="bottom-nav-icon">👤</span>
        <span>人員</span>
      </router-link>
      <router-link to="/admin/bookings" class="bottom-nav-item" :class="{ active: currentPath === '/admin/bookings' }">
        <span class="bottom-nav-icon">📅</span>
        <span>預約</span>
      </router-link>
      <router-link to="/admin/settings" class="bottom-nav-item" :class="{ active: currentPath === '/admin/settings' }">
        <span class="bottom-nav-icon">⚙️</span>
        <span>設定</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  pageTitle: {
    type: String,
    default: ''
  },
  storeName: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentPath = computed(() => route.path)

function handleLogout() {
  authStore.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
}

/* ===== 側邊欄（桌面） ===== */
.sidebar {
  width: 240px;
  background: linear-gradient(180deg, var(--primary-dark) 0%, #1a1a2e 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.sidebar-subtitle {
  font-size: 0.75rem;
  opacity: 0.7;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md) 0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.sidebar-link:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.sidebar-link.active {
  background: rgba(255,255,255,0.15);
  color: white;
  border-left-color: var(--primary);
}

.sidebar-icon {
  font-size: 1.125rem;
  width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid rgba(255,255,255,0.1);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  padding: var(--spacing-sm) 0;
  font-size: 0.875rem;
  width: 100%;
}

.logout-btn:hover {
  color: white;
}

/* ===== 主內容區 ===== */
.main-wrapper {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.mobile-header {
  display: none;
}

.main-content {
  flex: 1;
  padding: var(--spacing-xl);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

/* ===== 底部導航（手機） ===== */
.bottom-nav {
  display: none;
}

/* ===== 響應式 ===== */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }
  .main-wrapper {
    margin-left: 200px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .main-wrapper {
    margin-left: 0;
    padding-bottom: 80px;
  }

  .mobile-header {
    display: block;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    padding: var(--spacing-md) var(--spacing-lg);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .mobile-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }

  .main-content {
    padding: var(--spacing-md);
  }

  .content-header {
    display: none;
  }

  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    z-index: 100;
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-xs);
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.625rem;
    transition: color 0.2s;
  }

  .bottom-nav-item.active {
    color: var(--primary-dark);
  }

  .bottom-nav-icon {
    font-size: 1.25rem;
    margin-bottom: 2px;
  }
}
</style>
