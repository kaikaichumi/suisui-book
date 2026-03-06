<template>
  <div class="booking-page">
    <!-- 頂部導航 -->
    <header class="header">
      <div class="header-content container">
        <button @click="goBack" class="back-btn">&larr;</button>
        <h1 class="header-title">預約服務</h1>
        <div style="width: 40px;"></div>
      </div>
    </header>

    <main class="container page-content">
      <!-- 步驟指示 -->
      <div class="steps">
        <div class="step" :class="{ active: step === 1, completed: step > 1 }">
          <span class="step-number">1</span>
          <span class="step-text">選服務</span>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: step === 2, completed: step > 2 }">
          <span class="step-number">2</span>
          <span class="step-text">選人員</span>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: step === 3, completed: step > 3 }">
          <span class="step-number">3</span>
          <span class="step-text">選時間</span>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ active: step === 4 }">
          <span class="step-number">4</span>
          <span class="step-text">填資料</span>
        </div>
      </div>

      <!-- Step 1: 選擇服務 -->
      <div v-if="step === 1" class="step-content">
        <h2 class="section-title">選擇服務</h2>
        <div class="services-list">
          <div
            v-for="service in services"
            :key="service._id"
            class="service-card"
            :class="{ selected: selected.service?._id === service._id }"
            @click="selectService(service)"
          >
            <div class="service-info">
              <div class="service-name">{{ service.name }}</div>
              <div class="service-meta">{{ service.duration }} 分鐘</div>
            </div>
            <div class="service-price">{{ formatPrice(service) }}</div>
          </div>
        </div>
      </div>

      <!-- Step 2: 選擇服務人員 -->
      <div v-if="step === 2" class="step-content">
        <h2 class="section-title">選擇服務人員</h2>
        <div v-if="loadingStaff" class="loading"><div class="spinner"></div></div>
        <div v-else-if="staffList.length === 0" class="empty-state">
          <p>目前沒有可服務的人員</p>
          <button @click="step = 1" class="btn btn-secondary">返回上一步</button>
        </div>
        <div v-else class="staff-list">
          <div
            v-for="staff in staffList"
            :key="staff._id"
            class="staff-card"
            :class="{ selected: selected.staff?._id === staff._id }"
            @click="selectStaff(staff)"
          >
            <div class="staff-avatar">{{ staff.name.charAt(0) }}</div>
            <div class="staff-name">{{ staff.name }}</div>
          </div>
        </div>
      </div>

      <!-- Step 3: 選擇日期時間 -->
      <div v-if="step === 3" class="step-content">
        <h2 class="section-title">選擇日期與時間</h2>

        <div class="form-group">
          <label class="form-label">選擇日期</label>
          <input
            v-model="selected.date"
            type="date"
            :min="minDate"
            :max="maxDate"
            class="form-input"
            @change="loadSlots"
          />
        </div>

        <div v-if="selected.date">
          <div v-if="loadingSlots" class="loading"><div class="spinner"></div></div>
          <div v-else-if="slotsMessage" class="alert alert-warning">{{ slotsMessage }}</div>
          <div v-else-if="slots.length === 0" class="alert alert-warning">該日沒有可預約的時段</div>
          <div v-else>
            <label class="form-label">選擇時段</label>
            <div class="time-slots">
              <div
                v-for="slot in slots"
                :key="slot"
                class="time-slot"
                :class="{ selected: selected.time === slot }"
                @click="selectTime(slot)"
              >
                {{ slot }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: 填寫資料 -->
      <div v-if="step === 4" class="step-content">
        <h2 class="section-title">填寫預約資料</h2>

        <!-- 預約摘要 -->
        <div class="booking-summary card">
          <div class="summary-row">
            <span class="label">服務:</span>
            <span>{{ selected.service?.name }}</span>
          </div>
          <div class="summary-row">
            <span class="label">人員:</span>
            <span>{{ selected.staff?.name }}</span>
          </div>
          <div class="summary-row">
            <span class="label">時間:</span>
            <span>{{ formatDate(selected.date) }} {{ selected.time }}</span>
          </div>
          <div class="summary-row">
            <span class="label">費用:</span>
            <span class="price">{{ formatPrice(selected.service) }}</span>
          </div>
        </div>

        <!-- LINE 登入提示 -->
        <div v-if="!authStore.isCustomer" class="line-login-hint card">
          <p>使用 LINE 登入可自動帶入姓名</p>
          <button @click="lineLogin" class="btn-line btn-sm">
            <span class="line-icon">L</span>
            LINE 登入
          </button>
        </div>

        <form @submit.prevent="submitBooking">
          <div class="form-group">
            <label class="form-label">您的姓名 *</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="請輸入姓名" required />
          </div>
          <div class="form-group">
            <label class="form-label">手機號碼 *</label>
            <input v-model="form.phone" type="tel" class="form-input" placeholder="例如: 0912345678" required />
          </div>
          <div class="form-group">
            <label class="form-label">Email（選填，接收預約通知）</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="example@email.com" />
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="submitting">
            {{ submitting ? '預約中...' : '確認預約' }}
          </button>
        </form>
      </div>

      <!-- 預約成功 -->
      <div v-if="step === 5" class="step-content success-page">
        <div class="success-icon">✓</div>
        <h2>預約成功！</h2>
        <p>我們已收到您的預約，店家確認後會通知您。</p>

        <div class="booking-summary card">
          <div class="summary-row">
            <span class="label">服務:</span>
            <span>{{ selected.service?.name }}</span>
          </div>
          <div class="summary-row">
            <span class="label">人員:</span>
            <span>{{ selected.staff?.name }}</span>
          </div>
          <div class="summary-row">
            <span class="label">時間:</span>
            <span>{{ formatDate(selected.date) }} {{ selected.time }}</span>
          </div>
        </div>

        <div class="success-actions">
          <router-link :to="`/s/${slug}`" class="btn btn-primary btn-block">
            返回首頁
          </router-link>
          <router-link :to="`/s/${slug}/my`" class="btn btn-secondary btn-block">
            查看我的預約
          </router-link>
        </div>
      </div>

      <!-- 底部按鈕 -->
      <div v-if="step >= 2 && step <= 3" class="bottom-actions">
        <button @click="step--" class="btn btn-secondary">上一步</button>
        <button
          v-if="step === 3"
          @click="step++"
          class="btn btn-primary"
          :disabled="!selected.time"
        >
          下一步
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../utils/api'
import { useAuthStore } from '../../stores/auth'
import { formatPrice } from '../../utils/format'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const slug = route.params.slug
const step = ref(1)
const services = ref([])
const staffList = ref([])
const slots = ref([])
const slotsMessage = ref('')
const loadingStaff = ref(false)
const loadingSlots = ref(false)
const submitting = ref(false)

const selected = reactive({
  service: null,
  staff: null,
  date: '',
  time: ''
})

const form = reactive({
  name: authStore.isCustomer ? (authStore.user?.name || '') : '',
  phone: authStore.isCustomer ? (authStore.user?.phone || '') : '',
  email: authStore.isCustomer ? (authStore.user?.email || '') : ''
})

// 日期限制：今天到 30 天後
const minDate = computed(() => new Date().toISOString().split('T')[0])
const maxDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
})

const preSelectedStaffId = route.query.staffId || null

onMounted(async () => {
  // 載入服務列表
  try {
    const response = await api.get(`/stores/${slug}/services`)
    services.value = response.data

    // 如果 URL 有 serviceId，自動選擇該服務
    // loadStaff() 會自動處理 preSelectedStaffId 的預選邏輯
    const serviceId = route.query.serviceId
    if (serviceId) {
      const service = services.value.find(s => s._id === serviceId)
      if (service) {
        selectService(service)
      }
    }
  } catch (error) {
    console.error('Failed to load services:', error)
  }
})

function selectService(service) {
  selected.service = service
  step.value = 2
  loadStaff()
}

async function loadStaff() {
  loadingStaff.value = true
  staffList.value = []
  selected.staff = null

  try {
    const response = await api.get(`/stores/${slug}/services/${selected.service._id}/staff`)
    staffList.value = response.data

    // 如果有預選設計師（從探索頁進入），自動選擇並跳到時間選擇
    if (preSelectedStaffId) {
      const preStaff = staffList.value.find(s => s._id === preSelectedStaffId)
      if (preStaff) {
        selected.staff = preStaff
        step.value = 3
        return
      }
    }

    // 如果只有一個人員，自動選擇
    if (staffList.value.length === 1) {
      selectStaff(staffList.value[0])
    }
  } catch (error) {
    console.error('Failed to load staff:', error)
  } finally {
    loadingStaff.value = false
  }
}

function selectStaff(staff) {
  selected.staff = staff
  selected.date = ''
  selected.time = ''
  step.value = 3
}

async function loadSlots() {
  if (!selected.date) return

  loadingSlots.value = true
  slots.value = []
  slotsMessage.value = ''
  selected.time = ''

  try {
    const response = await api.get(`/stores/${slug}/available-slots`, {
      params: {
        serviceId: selected.service._id,
        staffId: selected.staff._id,
        date: selected.date
      }
    })
    slots.value = response.data.slots
    slotsMessage.value = response.data.message || ''
  } catch (error) {
    console.error('Failed to load slots:', error)
  } finally {
    loadingSlots.value = false
  }
}

function selectTime(time) {
  selected.time = time
}

async function submitBooking() {
  submitting.value = true

  try {
    await api.post(`/stores/${slug}/bookings`, {
      serviceId: selected.service._id,
      staffId: selected.staff._id,
      date: selected.date,
      startTime: selected.time,
      customerName: form.name,
      customerPhone: form.phone,
      customerEmail: form.email || undefined
    })
    step.value = 5
  } catch (error) {
    alert(error.response?.data?.message || '預約失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${month}/${day} (${weekday})`
}

function lineLogin() {
  const channelId = import.meta.env.VITE_LINE_CHANNEL_ID
  const callbackUrl = import.meta.env.VITE_LINE_CALLBACK_URL || `${window.location.origin}/auth/line/callback`
  const state = encodeURIComponent(`/s/${slug}/booking`)
  const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=profile%20openid`
  window.location.href = url
}

function goBack() {
  if (step.value > 1 && step.value < 5) {
    step.value--
  } else {
    router.push(`/s/${slug}`)
  }
}
</script>

<style scoped>
.booking-page {
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
  cursor: pointer;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-md);
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg) 0;
  overflow-x: auto;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
}

.step.active .step-number {
  background: var(--primary);
  color: white;
}

.step.completed .step-number {
  background: var(--success);
  color: white;
}

.step-text {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.step.active .step-text {
  color: var(--primary-dark);
  font-weight: 500;
}

.step-line {
  width: 40px;
  height: 2px;
  background: var(--border);
  margin: 0 var(--spacing-sm);
}

.step-content {
  padding-bottom: 100px;
}

.services-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  border: 2px solid transparent;
  transition: all 0.2s;
}

.service-card:hover {
  box-shadow: var(--shadow-md);
}

.service-card.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.service-info {
  flex: 1;
}

.service-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.service-meta {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.service-price {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 1.125rem;
  white-space: nowrap;
  margin-left: var(--spacing-md);
}

.staff-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

.staff-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md);
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.staff-card:hover {
  box-shadow: var(--shadow-md);
}

.staff-card.selected {
  border-color: var(--primary);
  background: var(--primary-light);
}

.staff-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.staff-name {
  font-weight: 500;
  text-align: center;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--spacing-sm);
}

.time-slot {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: center;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.time-slot:hover {
  border-color: var(--primary);
}

.time-slot.selected {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.booking-summary {
  margin-bottom: var(--spacing-lg);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row .label {
  color: var(--text-muted);
}

.summary-row .price {
  font-weight: 600;
  color: var(--primary-dark);
  font-size: 1.125rem;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: var(--spacing-md);
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.bottom-actions .btn {
  flex: 1;
  max-width: 200px;
}

.success-page {
  text-align: center;
  padding-top: var(--spacing-xl);
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--success);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto var(--spacing-lg);
}

.success-actions {
  margin-top: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.line-login-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background: #f0faf4;
  border: 1px solid #06C755;
  border-radius: var(--radius-md);
}

.line-login-hint p {
  font-size: 0.875rem;
  color: var(--text-light);
  margin: 0;
}

.btn-line {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: #06C755;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-line:hover {
  background: #05b34d;
}

.line-icon {
  width: 20px;
  height: 20px;
  background: white;
  color: #06C755;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
}

/* Desktop enhancements */
@media (min-width: 768px) {
  .page-content {
    padding: var(--spacing-xl);
  }

  .step-number {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .step-text {
    font-size: 0.875rem;
  }

  .step-line {
    width: 60px;
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
    font-size: 1.25rem;
  }

  .staff-avatar {
    width: 64px;
    height: 64px;
    font-size: 1.75rem;
  }

  .time-slots {
    grid-template-columns: repeat(6, 1fr);
  }

  .booking-summary {
    max-width: 500px;
  }

  form {
    max-width: 500px;
  }
}

/* Mobile adjustments */
@media (max-width: 480px) {
  .services-list {
    grid-template-columns: 1fr;
  }

  .staff-list {
    grid-template-columns: repeat(3, 1fr);
  }

  .time-slots {
    grid-template-columns: repeat(3, 1fr);
  }

  .line-login-hint {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }
}
</style>
