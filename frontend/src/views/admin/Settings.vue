<template>
  <AdminLayout pageTitle="店家設定">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="settings-layout">
      <!-- 左側：基本資訊 + 營業時間 -->
      <div class="settings-main">
        <!-- 基本資訊 -->
        <section class="card">
          <h3 class="card-title">基本資訊</h3>
          <form @submit.prevent="saveBasicInfo" class="form-grid">
            <div class="form-group">
              <label class="form-label">店家名稱</label>
              <input v-model="form.name" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">聯絡電話</label>
              <input v-model="form.phone" type="text" class="form-input" placeholder="聯絡電話" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">地址</label>
              <input v-model="form.address" type="text" class="form-input" placeholder="店家地址" />
            </div>
            <div class="form-group full-width">
              <label class="form-label">店家介紹</label>
              <textarea v-model="form.description" class="form-input" rows="3" placeholder="選填"></textarea>
            </div>
            <div class="form-actions full-width">
              <button type="submit" class="btn btn-primary" :disabled="savingInfo">
                {{ savingInfo ? '儲存中...' : '儲存資訊' }}
              </button>
            </div>
          </form>
        </section>

        <!-- 店家位置 -->
        <section class="card">
          <h3 class="card-title">店家位置（用於探索頁附近搜尋）</h3>
          <form @submit.prevent="saveLocation">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">經度 (Longitude)</label>
                <input v-model.number="locationForm.lng" type="number" step="any" class="form-input" placeholder="如：121.5654" />
              </div>
              <div class="form-group">
                <label class="form-label">緯度 (Latitude)</label>
                <input v-model.number="locationForm.lat" type="number" step="any" class="form-input" placeholder="如：25.0330" />
              </div>
              <div class="form-group full-width">
                <button type="button" class="btn btn-secondary" @click="autoLocate" :disabled="locating">
                  {{ locating ? '定位中...' : '使用目前位置自動填入' }}
                </button>
              </div>
            </div>
            <div v-if="locationForm.lat && locationForm.lng" class="location-preview">
              目前座標: {{ locationForm.lat }}, {{ locationForm.lng }}
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="savingLocation">
                {{ savingLocation ? '儲存中...' : '儲存位置' }}
              </button>
            </div>
          </form>
        </section>

        <!-- 通知設定 -->
        <section class="card">
          <h3 class="card-title">通知設定</h3>
          <form @submit.prevent="saveNotificationSettings">
            <div class="notification-group">
              <h4 class="notification-label">新預約通知</h4>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifForm.newBooking.email" /> Email 通知
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifForm.newBooking.line" /> LINE 通知
              </label>
            </div>
            <div class="notification-group">
              <h4 class="notification-label">取消預約通知</h4>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifForm.cancellation.email" /> Email 通知
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notifForm.cancellation.line" /> LINE 通知
              </label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="savingNotif">
                {{ savingNotif ? '儲存中...' : '儲存通知設定' }}
              </button>
            </div>
          </form>
        </section>

        <!-- 營業時間 -->
        <section class="card">
          <h3 class="card-title">營業時間</h3>
          <form @submit.prevent="saveHours">
            <div class="hours-grid">
              <div v-for="(day, key) in days" :key="key" class="hours-row">
                <span class="day-label">{{ day }}</span>
                <label class="closed-checkbox">
                  <input type="checkbox" v-model="form.businessHours[key].closed" />
                  <span>公休</span>
                </label>
                <div class="time-inputs" v-if="!form.businessHours[key].closed">
                  <input
                    v-model="form.businessHours[key].open"
                    type="time"
                    class="form-input time-input"
                  />
                  <span class="time-separator">至</span>
                  <input
                    v-model="form.businessHours[key].close"
                    type="time"
                    class="form-input time-input"
                  />
                </div>
                <div v-else class="closed-text">休息</div>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="savingHours">
                {{ savingHours ? '儲存中...' : '儲存營業時間' }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <!-- 右側：修改密碼 -->
      <div class="settings-sidebar">
        <section class="card">
          <h3 class="card-title">修改密碼</h3>
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label class="form-label">目前密碼</label>
              <input v-model="passwordForm.current" type="password" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">新密碼</label>
              <input v-model="passwordForm.new" type="password" class="form-input" placeholder="至少 6 個字元" required />
            </div>
            <div class="form-group">
              <label class="form-label">確認新密碼</label>
              <input v-model="passwordForm.confirm" type="password" class="form-input" required />
            </div>
            <button type="submit" class="btn btn-primary btn-block" :disabled="savingPassword">
              {{ savingPassword ? '修改中...' : '修改密碼' }}
            </button>
          </form>
        </section>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import api from '../../utils/api'

const loading = ref(true)
const savingInfo = ref(false)
const savingHours = ref(false)
const savingPassword = ref(false)
const savingLocation = ref(false)
const savingNotif = ref(false)
const locating = ref(false)

const days = {
  mon: '週一',
  tue: '週二',
  wed: '週三',
  thu: '週四',
  fri: '週五',
  sat: '週六',
  sun: '週日'
}

const form = reactive({
  name: '',
  address: '',
  phone: '',
  description: '',
  businessHours: {
    mon: { open: '09:00', close: '18:00', closed: false },
    tue: { open: '09:00', close: '18:00', closed: false },
    wed: { open: '09:00', close: '18:00', closed: false },
    thu: { open: '09:00', close: '18:00', closed: false },
    fri: { open: '09:00', close: '18:00', closed: false },
    sat: { open: '09:00', close: '18:00', closed: false },
    sun: { open: '09:00', close: '18:00', closed: true }
  }
})

const locationForm = reactive({ lat: 0, lng: 0 })

const notifForm = reactive({
  newBooking: { email: true, line: false },
  cancellation: { email: true, line: false }
})

const passwordForm = reactive({
  current: '',
  new: '',
  confirm: ''
})

async function loadSettings() {
  try {
    const response = await api.get('/admin/store')
    const data = response.data
    form.name = data.name
    form.address = data.address || ''
    form.phone = data.phone || ''
    form.description = data.description || ''
    if (data.businessHours) {
      Object.assign(form.businessHours, data.businessHours)
    }
    // 位置
    if (data.location?.coordinates) {
      locationForm.lng = data.location.coordinates[0] || 0
      locationForm.lat = data.location.coordinates[1] || 0
    }
    // 通知設定
    if (data.notificationSettings) {
      Object.assign(notifForm, data.notificationSettings)
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
}

async function saveBasicInfo() {
  savingInfo.value = true
  try {
    await api.put('/admin/store', {
      name: form.name,
      address: form.address,
      phone: form.phone,
      description: form.description
    })
    alert('資訊已儲存')
  } catch (error) {
    alert(error.response?.data?.message || '儲存失敗')
  } finally {
    savingInfo.value = false
  }
}

async function saveHours() {
  savingHours.value = true
  try {
    await api.put('/admin/store', {
      businessHours: form.businessHours
    })
    alert('營業時間已儲存')
  } catch (error) {
    alert(error.response?.data?.message || '儲存失敗')
  } finally {
    savingHours.value = false
  }
}

async function saveLocation() {
  savingLocation.value = true
  try {
    await api.put('/admin/store', {
      location: { coordinates: [locationForm.lng, locationForm.lat] }
    })
    alert('位置已儲存')
  } catch (error) {
    alert(error.response?.data?.message || '儲存失敗')
  } finally {
    savingLocation.value = false
  }
}

function autoLocate() {
  if (!navigator.geolocation) {
    alert('您的瀏覽器不支援定位功能')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locationForm.lat = pos.coords.latitude
      locationForm.lng = pos.coords.longitude
      locating.value = false
    },
    () => {
      alert('無法取得位置，請確認已允許定位權限')
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

async function saveNotificationSettings() {
  savingNotif.value = true
  try {
    await api.put('/admin/store', {
      notificationSettings: notifForm
    })
    alert('通知設定已儲存')
  } catch (error) {
    alert(error.response?.data?.message || '儲存失敗')
  } finally {
    savingNotif.value = false
  }
}

async function changePassword() {
  if (passwordForm.new !== passwordForm.confirm) {
    alert('新密碼與確認密碼不符')
    return
  }

  if (passwordForm.new.length < 6) {
    alert('新密碼至少需要 6 個字元')
    return
  }

  savingPassword.value = true
  try {
    await api.put('/admin/password', {
      currentPassword: passwordForm.current,
      newPassword: passwordForm.new
    })
    alert('密碼已修改')
    passwordForm.current = ''
    passwordForm.new = ''
    passwordForm.confirm = ''
  } catch (error) {
    alert(error.response?.data?.message || '修改失敗')
  } finally {
    savingPassword.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--spacing-lg);
  align-items: start;
}

.settings-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-actions {
  margin-top: var(--spacing-md);
}

.form-actions.full-width {
  grid-column: 1 / -1;
}

/* 營業時間 */
.hours-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.hours-row {
  display: grid;
  grid-template-columns: 50px 80px 1fr;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border);
}

.hours-row:last-child {
  border-bottom: none;
}

.day-label {
  font-weight: 500;
  color: var(--text);
}

.closed-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--text-muted);
  cursor: pointer;
}

.closed-checkbox input {
  width: 16px;
  height: 16px;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.time-input {
  width: 120px;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.time-separator {
  color: var(--text-muted);
}

.closed-text {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.btn-block {
  width: 100%;
}

.location-preview {
  padding: var(--spacing-sm);
  background: var(--primary-light);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--primary-dark);
  margin-bottom: var(--spacing-sm);
}
.notification-group {
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}
.notification-group:last-of-type {
  border-bottom: none;
}
.notification-label {
  font-size: 0.9375rem;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
  cursor: pointer;
}
.checkbox-label input {
  width: 16px;
  height: 16px;
}

/* 響應式 */
@media (max-width: 1024px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-sidebar {
    order: -1;
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .hours-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) 0;
  }

  .day-label {
    font-size: 0.875rem;
  }

  .time-inputs {
    flex-wrap: wrap;
  }

  .time-input {
    flex: 1;
    min-width: 100px;
  }
}
</style>
