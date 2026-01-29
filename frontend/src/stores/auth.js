import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

function getStoredUser() {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(getStoredUser())
  const token = ref(localStorage.getItem('token') || null)

  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => user.value?.role === 'superadmin')
  const isStoreAdmin = computed(() => user.value?.role === 'store')
  const isCustomer = computed(() => user.value?.role === 'customer')

  // 超級管理員登入
  async function superAdminLogin(username, password) {
    const response = await api.post('/superadmin/login', { username, password })
    const { token: newToken, user: userData } = response.data

    token.value = newToken
    user.value = userData
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))

    return userData
  }

  // 店家登入
  async function storeLogin(slug, password) {
    const response = await api.post('/admin/login', { slug, password })
    const { token: newToken, store } = response.data

    token.value = newToken
    user.value = { ...store, role: 'store' }
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(user.value))

    return store
  }

  // LINE 登入
  async function lineLogin(code) {
    const redirectUri = import.meta.env.VITE_LINE_CALLBACK_URL || `${window.location.origin}/auth/line/callback`
    const response = await api.post('/auth/line/callback', { code, redirectUri })
    const { token: newToken, customer } = response.data

    token.value = newToken
    user.value = { ...customer, role: 'customer' }
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(user.value))

    return customer
  }

  // 登出
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 檢查登入狀態
  async function checkAuth() {
    if (!token.value) return false

    try {
      if (user.value?.role === 'superadmin') {
        const response = await api.get('/superadmin/me')
        user.value = response.data
      } else if (user.value?.role === 'store') {
        const response = await api.get('/admin/me')
        user.value = { ...response.data, role: 'store' }
      } else if (user.value?.role === 'customer') {
        const response = await api.get('/auth/me')
        user.value = { ...response.data, role: 'customer' }
      }
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    isSuperAdmin,
    isStoreAdmin,
    isCustomer,
    superAdminLogin,
    storeLogin,
    lineLogin,
    logout,
    checkAuth
  }
})
