<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>水水 SuiSui Book</h1>
        <p>系統管理員登入</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label class="form-label">帳號</label>
          <input
            v-model="username"
            type="text"
            class="form-input"
            placeholder="請輸入帳號"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密碼</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="請輸入密碼"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading">
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>

      <div class="login-footer">
        <router-link to="/admin/login" class="link">店家登入</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await authStore.superAdminLogin(username.value, password.value)
    router.push('/superadmin')
  } catch (err) {
    error.value = err.response?.data?.message || '登入失敗'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg) 100%);
  padding: var(--spacing-md);
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xl);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.login-header h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-xs);
}

.login-header p {
  color: var(--text-muted);
}

.login-form {
  margin-bottom: var(--spacing-lg);
}

.login-footer {
  text-align: center;
}

.link {
  color: var(--primary-dark);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
