<template>
  <div class="booking-card card">
    <div class="booking-header">
      <div class="booking-time">
        <span class="date">{{ formatDate(booking.date) }}</span>
        <span class="time">{{ booking.startTime }} - {{ booking.endTime }}</span>
      </div>
      <span class="badge" :class="getStatusClass(booking.status)">
        {{ getStatusText(booking.status) }}
      </span>
    </div>

    <div class="booking-body">
      <div class="info-row">
        <span class="label">服務:</span>
        <span>{{ booking.serviceId?.name }}</span>
      </div>
      <div class="info-row">
        <span class="label">人員:</span>
        <span>{{ booking.staffId?.name }}</span>
      </div>
      <div v-if="booking.serviceId?.price != null" class="info-row">
        <span class="label">費用:</span>
        <span class="price">{{ formatPrice(booking.serviceId.price) }}</span>
      </div>
      <div class="info-row">
        <span class="label">顧客:</span>
        <span>{{ booking.customerName }}</span>
      </div>
      <div class="info-row">
        <span class="label">電話:</span>
        <a :href="'tel:' + booking.customerPhone" class="phone-link">
          {{ booking.customerPhone }}
        </a>
      </div>
      <div v-if="booking.note" class="info-row">
        <span class="label">備註:</span>
        <span>{{ booking.note }}</span>
      </div>
    </div>

    <div class="booking-actions">
      <button
        v-if="booking.status === 'pending'"
        @click="$emit('update-status', booking, 'confirmed')"
        class="btn btn-primary"
      >
        確認預約
      </button>
      <button
        v-if="booking.status === 'confirmed'"
        @click="$emit('update-status', booking, 'completed')"
        class="btn btn-secondary"
      >
        完成
      </button>
      <button
        v-if="booking.status !== 'cancelled' && booking.status !== 'completed'"
        @click="$emit('update-status', booking, 'cancelled')"
        class="btn btn-danger"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatPrice } from '../utils/format'

defineProps({
  booking: {
    type: Object,
    required: true
  }
})

defineEmits(['update-status'])

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[date.getDay()]
  return `${month}/${day} (${weekday})`
}

function getStatusClass(status) {
  const classes = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    cancelled: 'badge-cancelled',
    completed: 'badge-completed'
  }
  return classes[status] || ''
}

function getStatusText(status) {
  const texts = {
    pending: '待確認',
    confirmed: '已確認',
    cancelled: '已取消',
    completed: '已完成'
  }
  return texts[status] || status
}
</script>

<style scoped>
.booking-card {
  padding: var(--spacing-md);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.booking-time .date {
  font-weight: 600;
  display: block;
}

.booking-time .time {
  color: var(--primary-dark);
  font-size: 1.125rem;
  font-weight: 600;
}

.booking-body {
  margin-bottom: var(--spacing-md);
}

.info-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
}

.info-row .label {
  color: var(--text-muted);
  min-width: 45px;
}

.price {
  font-weight: 600;
  color: var(--primary-dark);
}

.phone-link {
  color: var(--primary-dark);
  text-decoration: none;
}

.phone-link:hover {
  text-decoration: underline;
}

.booking-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
</style>
