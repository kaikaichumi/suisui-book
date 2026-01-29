<template>
  <div class="callback-page">
    <div v-if="error" class="callback-content">
      <div class="error-icon">!</div>
      <h2>LINE 登入失敗</h2>
      <p>{{ errorMessage }}</p>
      <button @click="goBack" class="btn btn-primary">返回</button>
    </div>
    <div v-else class="callback-content">
      <div class="spinner"></div>
      <p>正在處理 LINE 登入...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const error = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const code = route.query.code
  const state = route.query.state
  const errorParam = route.query.error

  if (errorParam) {
    error.value = true
    errorMessage.value = '您取消了 LINE 登入'
    return
  }

  if (!code) {
    error.value = true
    errorMessage.value = '缺少授權碼'
    return
  }

  try {
    await authStore.lineLogin(code)

    // 從 state 中取得返回路徑
    const returnPath = state ? decodeURIComponent(state) : '/'
    router.replace(returnPath)
  } catch (err) {
    error.value = true
    errorMessage.value = err.response?.data?.message || 'LINE 登入失敗，請稍後再試'
  }
})

function goBack() {
  router.replace('/')
}
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.callback-content {
  text-align: center;
  padding: var(--spacing-xl);
}

.error-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--danger);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 auto var(--spacing-md);
}

.callback-content p {
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
}
</style>
