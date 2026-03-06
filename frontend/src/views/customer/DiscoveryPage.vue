<template>
  <div class="discovery-page">
    <!-- Header -->
    <div class="discovery-header">
      <div class="header-inner">
        <h1 class="brand">SuiSui Book</h1>
        <router-link v-if="authStore.isCustomer" to="/s" class="header-link">我的預約</router-link>
      </div>
    </div>

    <div class="container-wide page-content">
      <!-- 搜尋區 -->
      <div class="search-section">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋設計師、服務..."
            class="form-input search-input"
            @keyup.enter="doSearch"
          />
          <button class="btn btn-primary search-btn" @click="doSearch">搜尋</button>
        </div>
        <button class="location-btn" @click="requestLocation" :disabled="locating">
          <span v-if="locating">定位中...</span>
          <span v-else-if="userLocation">{{ locationLabel }} ({{ radiusKm }}km)</span>
          <span v-else>&#9906; 使用目前位置</span>
        </button>
      </div>

      <!-- 分類選擇 -->
      <CategoryPills
        v-if="categories.length"
        :categories="categories"
        v-model="selectedCategory"
        @update:modelValue="doSearch"
      />

      <!-- 推薦設計師 -->
      <section v-if="!isSearching && featuredStylists.length" class="section">
        <h2 class="section-title">推薦設計師</h2>
        <div class="featured-scroll">
          <StylistCard
            v-for="s in featuredStylists"
            :key="s._id"
            :stylist="s"
            class="featured-card"
            @click="goToStylist(s)"
          />
        </div>
      </section>

      <!-- 搜尋結果 / 附近設計師 -->
      <section class="section">
        <h2 class="section-title">
          {{ isSearching ? '搜尋結果' : '探索設計師' }}
          <span v-if="total > 0" class="result-count">{{ total }} 位</span>
        </h2>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>

        <div v-else-if="stylists.length" class="stylist-grid">
          <StylistCard
            v-for="s in stylists"
            :key="s._id"
            :stylist="s"
            @click="goToStylist(s)"
          />
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-icon">&#128269;</div>
          <p v-if="isSearching">找不到符合條件的設計師</p>
          <p v-else>開啟定位或搜尋來探索附近的設計師</p>
        </div>

        <!-- 分頁 -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="btn btn-secondary" :disabled="page <= 1" @click="changePage(page - 1)">上一頁</button>
          <span class="page-info">{{ page }} / {{ totalPages }}</span>
          <button class="btn btn-secondary" :disabled="page >= totalPages" @click="changePage(page + 1)">下一頁</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'
import CategoryPills from '../../components/CategoryPills.vue'
import StylistCard from '../../components/StylistCard.vue'

const router = useRouter()
const authStore = useAuthStore()

const categories = ref([])
const featuredStylists = ref([])
const stylists = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const totalPages = ref(0)

const searchQuery = ref('')
const selectedCategory = ref(null)
const userLocation = ref(null)
const locating = ref(false)
const radiusKm = ref(10)

const isSearching = computed(() => searchQuery.value || selectedCategory.value || userLocation.value)
const locationLabel = computed(() => userLocation.value ? '已定位' : '')

onMounted(async () => {
  await loadCategories()
  await loadFeatured()
  await doSearch()
})

async function loadCategories() {
  try {
    const { data } = await api.get('/discover/categories')
    categories.value = data
  } catch (e) { /* ignore */ }
}

async function loadFeatured() {
  try {
    const { data } = await api.get('/discover/stylists/featured')
    featuredStylists.value = data
  } catch (e) { /* ignore */ }
}

async function doSearch() {
  loading.value = true
  try {
    const params = { page: page.value, limit: 20 }
    if (searchQuery.value) params.q = searchQuery.value
    if (selectedCategory.value) params.category = selectedCategory.value
    if (userLocation.value) {
      params.lat = userLocation.value.lat
      params.lng = userLocation.value.lng
      params.radius = radiusKm.value
      params.sort = 'distance'
    }

    const { data } = await api.get('/discover/stylists', { params })
    stylists.value = data.stylists
    total.value = data.total
    totalPages.value = data.totalPages
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function requestLocation() {
  if (!navigator.geolocation) {
    alert('您的瀏覽器不支援定位功能')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      locating.value = false
      page.value = 1
      doSearch()
    },
    () => {
      alert('無法取得位置，請確認已允許定位權限')
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

function changePage(p) {
  page.value = p
  doSearch()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToStylist(s) {
  const identifier = s.slug || s._id
  router.push(`/stylist/${identifier}`)
}
</script>

<style scoped>
.discovery-page {
  min-height: 100vh;
  background: var(--bg);
}
.discovery-header {
  background: white;
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1024px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-dark);
}
.header-link {
  font-size: 0.875rem;
  color: var(--primary-dark);
  text-decoration: none;
}
.search-section {
  padding: var(--spacing-lg) 0 var(--spacing-sm);
}
.search-bar {
  display: flex;
  gap: var(--spacing-sm);
}
.search-input {
  flex: 1;
}
.search-btn {
  white-space: nowrap;
  padding: var(--spacing-sm) var(--spacing-md);
}
.location-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-light);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
}
.location-btn:hover {
  border-color: var(--primary);
  color: var(--primary-dark);
}
.section {
  padding: var(--spacing-md) 0;
}
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.result-count {
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--text-muted);
}
.featured-scroll {
  display: flex;
  gap: var(--spacing-md);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.featured-scroll::-webkit-scrollbar {
  display: none;
}
.featured-card {
  min-width: 260px;
  flex-shrink: 0;
}
.stylist-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}
@media (min-width: 640px) {
  .stylist-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .stylist-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) 0;
}
.page-info {
  font-size: 0.875rem;
  color: var(--text-muted);
}
</style>
