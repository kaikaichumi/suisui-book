<template>
  <AdminLayout pageTitle="預約管理">
    <!-- 檢視模式切換 -->
    <div class="view-tabs">
      <button
        v-for="mode in viewModes"
        :key="mode.value"
        @click="viewMode = mode.value"
        :class="['view-tab', { active: viewMode === mode.value }]"
      >
        {{ mode.label }}
      </button>
    </div>

    <!-- 篩選器 -->
    <div class="filters card">
      <div class="filter-row">
        <!-- 日檢視：日期選擇 -->
        <div v-if="viewMode === 'day'" class="filter-item">
          <label class="form-label">日期</label>
          <div class="date-nav">
            <button @click="prevDay" class="btn btn-sm btn-secondary">&lt;</button>
            <input v-model="filters.date" type="date" class="form-input" @change="loadBookings" />
            <button @click="nextDay" class="btn btn-sm btn-secondary">&gt;</button>
          </div>
        </div>

        <!-- 週檢視：週選擇 -->
        <div v-if="viewMode === 'week'" class="filter-item">
          <label class="form-label">選擇週</label>
          <div class="date-nav">
            <button @click="prevWeek" class="btn btn-sm btn-secondary">&lt;</button>
            <span class="week-display">{{ weekDisplayText }}</span>
            <button @click="nextWeek" class="btn btn-sm btn-secondary">&gt;</button>
          </div>
        </div>

        <!-- 月檢視：月選擇 -->
        <div v-if="viewMode === 'month'" class="filter-item">
          <label class="form-label">選擇月份</label>
          <div class="date-nav">
            <button @click="prevMonth" class="btn btn-sm btn-secondary">&lt;</button>
            <span class="month-display">{{ currentYear }}年 {{ currentMonth + 1 }}月</span>
            <button @click="nextMonth" class="btn btn-sm btn-secondary">&gt;</button>
          </div>
        </div>

        <!-- 服務人員篩選 -->
        <div class="filter-item">
          <label class="form-label">服務人員</label>
          <select v-model="filters.staffId" class="form-input" @change="loadBookings">
            <option value="">全部人員</option>
            <option v-for="s in staffList" :key="s._id" :value="s._id">{{ s.name }}</option>
          </select>
        </div>

        <!-- 狀態篩選 -->
        <div class="filter-item">
          <label class="form-label">狀態</label>
          <select v-model="filters.status" class="form-input" @change="loadBookings">
            <option value="">全部狀態</option>
            <option value="pending">待確認</option>
            <option value="confirmed">已確認</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <!-- 排除選項 -->
      <div class="filter-row exclude-row">
        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.excludeCancelled" />
          <span>排除已取消</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.excludeCompleted" />
          <span>排除已完成</span>
        </label>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <!-- 日檢視 -->
    <template v-else-if="viewMode === 'day'">
      <div v-if="filteredBookings.length === 0" class="empty-state card">
        <div class="empty-state-icon">📅</div>
        <p>今天沒有預約</p>
      </div>
      <div v-else class="bookings-grid">
        <BookingCard
          v-for="booking in filteredBookings"
          :key="booking._id"
          :booking="booking"
          @update-status="updateStatus"
        />
      </div>
    </template>

    <!-- 週檢視 -->
    <template v-else-if="viewMode === 'week'">
      <div class="week-view-horizontal">
        <div class="week-header">
          <div
            v-for="(day, index) in weekDays"
            :key="index"
            class="week-day-header"
            :class="{ 'today': isToday(day.date) }"
          >
            <div class="weekday-name">{{ day.weekdayName }}</div>
            <div class="weekday-date">{{ day.displayDate }}</div>
          </div>
        </div>
        <div class="week-body">
          <div
            v-for="(day, index) in weekDays"
            :key="index"
            class="week-day-column"
            :class="{ 'today-column': isToday(day.date) }"
          >
            <div v-if="getFilteredBookingsForDate(day.dateStr).length === 0" class="no-bookings">
              無預約
            </div>
            <div
              v-for="booking in getFilteredBookingsForDate(day.dateStr)"
              :key="booking._id"
              class="week-booking-card"
              :class="getStatusClass(booking.status)"
              @click="showBookingDetail(booking)"
            >
              <div class="booking-time-label">{{ booking.startTime }}</div>
              <div class="booking-customer">{{ booking.customerName }}</div>
              <div class="booking-service">{{ booking.serviceId?.name }}</div>
              <div class="booking-staff">{{ booking.staffId?.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 月檢視 -->
    <template v-else-if="viewMode === 'month'">
      <div class="calendar">
        <div class="calendar-header">
          <div v-for="day in weekdayHeaders" :key="day" class="calendar-weekday">{{ day }}</div>
        </div>
        <div class="calendar-body">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'has-bookings': day.bookingCount > 0
            }"
            @click="day.isCurrentMonth && selectCalendarDay(day)"
          >
            <div class="day-number">{{ day.day }}</div>
            <div v-if="day.bookingCount > 0" class="booking-count">
              {{ day.bookingCount }} 筆
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedDate" class="selected-day-bookings">
        <h3 class="selected-date-title">
          {{ formatSelectedDate(selectedDate) }} 的預約
          <button @click="selectedDate = null" class="btn btn-sm btn-secondary">關閉</button>
        </h3>
        <div v-if="selectedDayBookings.length === 0" class="empty-state card">
          <p>當天沒有預約</p>
        </div>
        <div v-else class="bookings-grid">
          <BookingCard
            v-for="booking in selectedDayBookings"
            :key="booking._id"
            :booking="booking"
            @update-status="updateStatus"
          />
        </div>
      </div>
    </template>

    <!-- 預約詳情 Modal -->
    <div v-if="detailBooking" class="modal-overlay" @click.self="detailBooking = null">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">預約詳情</h3>
          <button @click="detailBooking = null" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <BookingCard
            :booking="detailBooking"
            @update-status="(b, s) => { updateStatus(b, s); detailBooking = null; }"
          />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import api from '../../utils/api'
import BookingCard from '../../components/BookingCard.vue'

const loading = ref(true)
const bookings = ref([])
const allBookings = ref([])
const staffList = ref([])
const detailBooking = ref(null)
const selectedDate = ref(null)

const viewModes = [
  { value: 'day', label: '日' },
  { value: 'week', label: '週' },
  { value: 'month', label: '月' }
]
const viewMode = ref('day')

const filters = reactive({
  date: new Date().toISOString().split('T')[0],
  status: '',
  staffId: '',
  excludeCancelled: true,
  excludeCompleted: true
})

const currentWeekStart = ref(getWeekStart(new Date()))
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const weekdayHeaders = ['日', '一', '二', '三', '四', '五', '六']

const filteredBookings = computed(() => applyExcludeFilters(bookings.value))

const weekDisplayText = computed(() => {
  const start = currentWeekStart.value
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
})

const weekDays = computed(() => {
  const days = []
  const start = new Date(currentWeekStart.value)
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      weekdayName: weekdayHeaders[date.getDay()],
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`
    })
  }
  return days
})

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0)

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay.getDate() - i
    const date = new Date(currentYear.value, currentMonth.value - 1, day)
    days.push({
      day, date, dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: false, isToday: false,
      bookingCount: getBookingCountForDate(date.toISOString().split('T')[0])
    })
  }

  const today = new Date().toISOString().split('T')[0]
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(currentYear.value, currentMonth.value, day)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      day, date, dateStr, isCurrentMonth: true, isToday: dateStr === today,
      bookingCount: getBookingCountForDate(dateStr)
    })
  }

  const remaining = 42 - days.length
  for (let day = 1; day <= remaining; day++) {
    const date = new Date(currentYear.value, currentMonth.value + 1, day)
    days.push({
      day, date, dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: false, isToday: false,
      bookingCount: getBookingCountForDate(date.toISOString().split('T')[0])
    })
  }
  return days
})

const selectedDayBookings = computed(() => {
  if (!selectedDate.value) return []
  return applyExcludeFilters(getBookingsForDate(selectedDate.value))
})

function applyExcludeFilters(bookingList) {
  return bookingList.filter(b => {
    if (filters.excludeCancelled && b.status === 'cancelled') return false
    if (filters.excludeCompleted && b.status === 'completed') return false
    return true
  })
}

function getWeekStart(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function isToday(date) {
  return date.toDateString() === new Date().toDateString()
}

function getBookingsForDate(dateStr) {
  return allBookings.value.filter(b => {
    const bookingDate = new Date(b.date).toISOString().split('T')[0]
    const matchDate = bookingDate === dateStr
    const matchStaff = !filters.staffId || b.staffId?._id === filters.staffId
    const matchStatus = !filters.status || b.status === filters.status
    return matchDate && matchStaff && matchStatus
  })
}

function getFilteredBookingsForDate(dateStr) {
  return applyExcludeFilters(getBookingsForDate(dateStr)).sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function getBookingCountForDate(dateStr) {
  return applyExcludeFilters(getBookingsForDate(dateStr)).length
}

function prevDay() {
  const d = new Date(filters.date)
  d.setDate(d.getDate() - 1)
  filters.date = d.toISOString().split('T')[0]
  loadBookings()
}

function nextDay() {
  const d = new Date(filters.date)
  d.setDate(d.getDate() + 1)
  filters.date = d.toISOString().split('T')[0]
  loadBookings()
}

function prevWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() - 7)
  currentWeekStart.value = d
  loadWeekBookings()
}

function nextWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() + 7)
  currentWeekStart.value = d
  loadWeekBookings()
}

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else { currentMonth.value-- }
  loadMonthBookings()
}

function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else { currentMonth.value++ }
  loadMonthBookings()
}

function selectCalendarDay(day) { selectedDate.value = day.dateStr }
function showBookingDetail(booking) { detailBooking.value = booking }

async function loadStaff() {
  try {
    const response = await api.get('/admin/staff')
    staffList.value = Array.isArray(response.data) ? response.data : []
  } catch (error) { console.error('Failed to load staff:', error) }
}

async function loadBookings() {
  loading.value = true
  try {
    const params = {}
    if (filters.date) params.date = filters.date
    if (filters.status) params.status = filters.status
    const response = await api.get('/admin/bookings', { params })
    const data = Array.isArray(response.data) ? response.data : (response.data.bookings || [])
    bookings.value = filters.staffId ? data.filter(b => b.staffId?._id === filters.staffId) : data
  } catch (error) { console.error('Failed to load bookings:', error) }
  finally { loading.value = false }
}

async function loadWeekBookings() {
  loading.value = true
  try {
    const start = currentWeekStart.value.toISOString().split('T')[0]
    const end = new Date(currentWeekStart.value)
    end.setDate(end.getDate() + 6)
    const response = await api.get('/admin/bookings', { params: { startDate: start, endDate: end.toISOString().split('T')[0] } })
    allBookings.value = Array.isArray(response.data) ? response.data : (response.data.bookings || [])
  } catch (error) { console.error('Failed to load week bookings:', error) }
  finally { loading.value = false }
}

async function loadMonthBookings() {
  loading.value = true
  selectedDate.value = null
  try {
    const start = new Date(currentYear.value, currentMonth.value, 1).toISOString().split('T')[0]
    const end = new Date(currentYear.value, currentMonth.value + 1, 0).toISOString().split('T')[0]
    const response = await api.get('/admin/bookings', { params: { startDate: start, endDate: end } })
    allBookings.value = Array.isArray(response.data) ? response.data : (response.data.bookings || [])
  } catch (error) { console.error('Failed to load month bookings:', error) }
  finally { loading.value = false }
}

async function updateStatus(booking, status) {
  const actions = { confirmed: '確認', completed: '完成', cancelled: '取消' }
  if (!confirm(`確定要${actions[status]}此預約嗎？`)) return
  try {
    await api.put(`/admin/bookings/${booking._id}`, { status })
    if (viewMode.value === 'day') await loadBookings()
    else if (viewMode.value === 'week') await loadWeekBookings()
    else await loadMonthBookings()
  } catch (error) { alert(error.response?.data?.message || '操作失敗') }
}

function formatSelectedDate(dateStr) {
  const date = new Date(dateStr)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${date.getMonth() + 1}月${date.getDate()}日 (${weekdays[date.getDay()]})`
}

function getStatusClass(status) { return `status-${status}` }

watch(viewMode, (newMode) => {
  if (newMode === 'day') loadBookings()
  else if (newMode === 'week') { currentWeekStart.value = getWeekStart(new Date()); loadWeekBookings() }
  else { currentYear.value = new Date().getFullYear(); currentMonth.value = new Date().getMonth(); loadMonthBookings() }
})

watch([() => filters.staffId, () => filters.status], () => { if (viewMode.value === 'day') loadBookings() })

onMounted(async () => { await loadStaff(); await loadBookings() })
</script>

<style scoped>
.view-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  background: white;
  padding: var(--spacing-xs);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.view-tab {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.view-tab.active {
  background: var(--primary);
  color: white;
}

.filters {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.filter-item {
  min-width: 0;
}

.exclude-row {
  display: flex;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: 0.875rem;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.date-nav .form-input {
  flex: 1;
  text-align: center;
}

.week-display, .month-display {
  flex: 1;
  text-align: center;
  font-weight: 600;
  padding: var(--spacing-sm);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.875rem;
  min-height: auto;
}

.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

/* Week view */
.week-view-horizontal {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 2px solid var(--border);
}

.week-day-header {
  padding: var(--spacing-sm);
  text-align: center;
  background: var(--bg);
  border-right: 1px solid var(--border);
}

.week-day-header:last-child { border-right: none; }
.week-day-header.today { background: var(--primary); color: white; }
.weekday-name { font-weight: 600; font-size: 0.875rem; }
.weekday-date { font-size: 0.75rem; opacity: 0.8; }

.week-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  overflow-y: auto;
  flex: 1;
}

.week-day-column {
  border-right: 1px solid var(--border);
  padding: var(--spacing-xs);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-height: 200px;
}

.week-day-column:last-child { border-right: none; }
.week-day-column.today-column { background: rgba(232, 121, 140, 0.05); }

.no-bookings {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: var(--spacing-md);
}

.week-booking-card {
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform 0.1s;
  font-size: 0.8rem;
}

.week-booking-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.week-booking-card.status-pending { background: #fff3cd; border-left: 4px solid #ffc107; }
.week-booking-card.status-confirmed { background: #d4edda; border-left: 4px solid #28a745; }
.week-booking-card.status-completed { background: #e2e3e5; border-left: 4px solid #6c757d; }
.week-booking-card.status-cancelled { background: #f8d7da; border-left: 4px solid #dc3545; }

.booking-time-label { font-weight: 700; color: var(--primary-dark); }
.booking-customer { font-weight: 600; }
.booking-service, .booking-staff { font-size: 0.75rem; color: var(--text-muted); }

/* Calendar */
.calendar {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--primary);
  color: white;
}

.calendar-weekday {
  padding: var(--spacing-sm);
  text-align: center;
  font-weight: 600;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  aspect-ratio: 1;
  padding: var(--spacing-xs);
  border: 1px solid var(--border);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70px;
}

.calendar-day:hover { background: var(--bg); }
.calendar-day.other-month { background: #fafafa; color: var(--text-muted); }
.calendar-day.today { background: var(--primary-light); }
.calendar-day.today .day-number {
  background: var(--primary);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.booking-count {
  font-size: 0.7rem;
  color: var(--primary-dark);
  background: var(--primary-light);
  padding: 2px 6px;
  border-radius: 10px;
  margin-top: 4px;
}

.selected-day-bookings { margin-top: var(--spacing-lg); }

.selected-date-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

@media (max-width: 768px) {
  .filter-row { grid-template-columns: 1fr; }
  .exclude-row { flex-wrap: wrap; }
  .bookings-grid { grid-template-columns: 1fr; }
  .week-view-horizontal { max-height: 400px; }
  .week-day-header { padding: var(--spacing-xs); }
  .weekday-name { font-size: 0.75rem; }
  .calendar-day { min-height: 50px; }
}
</style>
