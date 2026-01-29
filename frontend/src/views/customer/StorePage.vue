<template>
  <div class="store-page">
    <div v-if="loading" class="loading-page">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-page">
      <div class="error-content">
        <div class="error-icon">😕</div>
        <h2>找不到店家</h2>
        <p>請確認網址是否正確</p>
      </div>
    </div>

    <template v-else>
      <!-- 店家資訊 -->
      <header class="store-header">
        <h1 class="store-name">{{ store.name }}</h1>
        <div v-if="store.description" class="store-desc">{{ store.description }}</div>
        <div class="store-contact">
          <a v-if="store.phone" :href="'tel:' + store.phone" class="contact-item">
            📞 {{ store.phone }}
          </a>
          <span v-if="store.address" class="contact-item">
            📍 {{ store.address }}
          </span>
        </div>
      </header>

      <!-- 服務列表 -->
      <main class="container page-content">
        <h2 class="section-title">服務項目</h2>

        <div v-if="services.length === 0" class="empty-state">
          <p>目前沒有可預約的服務</p>
        </div>

        <div v-else class="services-list">
          <div
            v-for="service in services"
            :key="service._id"
            class="service-card"
            @click="selectService(service)"
          >
            <div class="service-info">
              <div class="service-name">{{ service.name }}</div>
              <div class="service-meta">{{ service.duration }} 分鐘</div>
              <div v-if="service.description" class="service-desc">{{ service.description }}</div>
            </div>
            <div class="service-price">{{ formatPrice(service.price) }}</div>
          </div>
        </div>

        <!-- LINE 登入 / 用戶狀態 -->
        <div class="login-section">
          <div v-if="authStore.isCustomer" class="user-info card">
            <div class="user-header">
              <img v-if="authStore.user?.pictureUrl" :src="authStore.user.pictureUrl" class="user-avatar" alt="" />
              <div class="user-avatar-placeholder" v-else>{{ (authStore.user?.name || '?').charAt(0) }}</div>
              <div>
                <div class="user-name">{{ authStore.user?.name }}</div>
                <div class="user-hint">已透過 LINE 登入</div>
              </div>
            </div>
            <button @click="authStore.logout()" class="btn btn-secondary btn-sm">登出</button>
          </div>
          <div v-else class="line-login-wrapper">
            <button @click="lineLogin" class="btn-line">
              <span class="line-icon">L</span>
              LINE 登入
            </button>
            <p class="login-hint">登入後可快速預約並查詢紀錄</p>
          </div>
        </div>

        <!-- 其他連結 -->
        <div class="other-links">
          <router-link :to="`/s/${slug}/my`" class="link-btn">
            查詢我的預約
          </router-link>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../utils/api'
import { useAuthStore } from '../../stores/auth'
import { formatPrice } from '../../utils/format'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const slug = route.params.slug
const loading = ref(true)
const error = ref(false)
const store = ref(null)
const services = ref([])

async function loadData() {
  try {
    const [storeRes, servicesRes] = await Promise.all([
      api.get(`/stores/${slug}`),
      api.get(`/stores/${slug}/services`)
    ])
    store.value = storeRes.data
    services.value = servicesRes.data
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
}

function selectService(service) {
  router.push({
    path: `/s/${slug}/booking`,
    query: { serviceId: service._id }
  })
}

function lineLogin() {
  const channelId = import.meta.env.VITE_LINE_CHANNEL_ID
  const callbackUrl = import.meta.env.VITE_LINE_CALLBACK_URL || `${window.location.origin}/auth/line/callback`
  const state = encodeURIComponent(`/s/${slug}`)
  const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=profile%20openid`
  window.location.href = url
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.store-page {
  min-height: 100vh;
  background: var(--bg);
}

.loading-page,
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-content {
  text-align: center;
  color: var(--text-muted);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.store-header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  padding: var(--spacing-xl) var(--spacing-md);
  text-align: center;
}

.store-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.store-desc {
  opacity: 0.9;
  margin-bottom: var(--spacing-md);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.store-contact {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
  align-items: center;
}

.contact-item {
  color: white;
  text-decoration: none;
  font-size: 0.875rem;
}

.page-content {
  padding: var(--spacing-lg) var(--spacing-md);
  max-width: 900px;
  margin: 0 auto;
}

.services-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

.service-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.service-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.service-card:active {
  transform: translateY(0);
}

.service-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.service-meta {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.service-desc {
  color: var(--text-light);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.service-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-dark);
  white-space: nowrap;
  margin-left: var(--spacing-md);
}

.login-section {
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  max-width: 500px;
  margin: 0 auto;
}

.user-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.user-name {
  font-weight: 600;
}

.user-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.875rem;
  min-height: auto;
}

.line-login-wrapper {
  text-align: center;
}

.btn-line {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: #06C755;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-line:hover {
  background: #05b34d;
}

.line-icon {
  width: 24px;
  height: 24px;
  background: white;
  color: #06C755;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.login-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.other-links {
  margin-top: var(--spacing-xl);
  text-align: center;
}

.link-btn {
  color: var(--primary-dark);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--primary);
  border-radius: var(--radius-md);
  display: inline-block;
  transition: all 0.2s;
}

.link-btn:hover {
  background: var(--primary);
  color: white;
}

/* Desktop enhancements */
@media (min-width: 768px) {
  .store-header {
    padding: var(--spacing-xxl) var(--spacing-xl);
  }

  .store-name {
    font-size: 2.25rem;
  }

  .page-content {
    padding: var(--spacing-xl);
  }

  .section-title {
    font-size: 1.25rem;
    margin-bottom: var(--spacing-lg);
  }

  .service-card {
    padding: var(--spacing-lg);
  }

  .service-name {
    font-size: 1.125rem;
  }

  .service-price {
    font-size: 1.5rem;
  }
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .services-list {
    grid-template-columns: 1fr;
  }

  .store-contact {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}
</style>
