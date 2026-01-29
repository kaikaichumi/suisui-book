import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// 顧客頁面
import StorePage from '../views/customer/StorePage.vue'
import BookingPage from '../views/customer/BookingPage.vue'
import MyBookings from '../views/customer/MyBookings.vue'

// 店家後台
import AdminLogin from '../views/admin/Login.vue'
import AdminDashboard from '../views/admin/Dashboard.vue'
import AdminServices from '../views/admin/Services.vue'
import AdminStaff from '../views/admin/Staff.vue'
import AdminBookings from '../views/admin/Bookings.vue'
import AdminSettings from '../views/admin/Settings.vue'

// LINE 登入回調
import LineCallback from '../views/customer/LineCallback.vue'

// 法律頁面
import PrivacyPage from '../views/legal/PrivacyPage.vue'
import TermsPage from '../views/legal/TermsPage.vue'

// 超級管理員
import SuperAdminLogin from '../views/superadmin/Login.vue'
import SuperAdminDashboard from '../views/superadmin/Dashboard.vue'
import SuperAdminStores from '../views/superadmin/Stores.vue'
import SuperAdminBookings from '../views/superadmin/AllBookings.vue'

const routes = [
  // 首頁重導向
  {
    path: '/',
    redirect: '/superadmin/login'
  },

  // ===== LINE 登入回調 =====
  {
    path: '/auth/line/callback',
    name: 'LineCallback',
    component: LineCallback
  },

  // ===== 法律頁面 =====
  {
    path: '/privacy',
    name: 'Privacy',
    component: PrivacyPage
  },
  {
    path: '/terms',
    name: 'Terms',
    component: TermsPage
  },

  // ===== 顧客端 =====
  {
    path: '/s/:slug',
    name: 'StorePage',
    component: StorePage
  },
  {
    path: '/s/:slug/booking',
    name: 'BookingPage',
    component: BookingPage
  },
  {
    path: '/s/:slug/my',
    name: 'MyBookings',
    component: MyBookings
  },

  // ===== 店家後台 =====
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresStoreAuth: true }
  },
  {
    path: '/admin/services',
    name: 'AdminServices',
    component: AdminServices,
    meta: { requiresStoreAuth: true }
  },
  {
    path: '/admin/staff',
    name: 'AdminStaff',
    component: AdminStaff,
    meta: { requiresStoreAuth: true }
  },
  {
    path: '/admin/bookings',
    name: 'AdminBookings',
    component: AdminBookings,
    meta: { requiresStoreAuth: true }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: AdminSettings,
    meta: { requiresStoreAuth: true }
  },

  // ===== 超級管理員 =====
  {
    path: '/superadmin/login',
    name: 'SuperAdminLogin',
    component: SuperAdminLogin
  },
  {
    path: '/superadmin',
    name: 'SuperAdminDashboard',
    component: SuperAdminDashboard,
    meta: { requiresSuperAdmin: true }
  },
  {
    path: '/superadmin/stores',
    name: 'SuperAdminStores',
    component: SuperAdminStores,
    meta: { requiresSuperAdmin: true }
  },
  {
    path: '/superadmin/bookings',
    name: 'SuperAdminBookings',
    component: SuperAdminBookings,
    meta: { requiresSuperAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守衛
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresSuperAdmin) {
    if (!authStore.isLoggedIn || !authStore.isSuperAdmin) {
      next('/superadmin/login')
      return
    }
  }

  if (to.meta.requiresStoreAuth) {
    if (!authStore.isLoggedIn || !authStore.isStoreAdmin) {
      next('/admin/login')
      return
    }
  }

  next()
})

export default router
