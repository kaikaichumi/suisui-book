<template>
  <div class="stylist-page">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <button class="back-btn" @click="$router.back()">&larr;</button>
        <span class="header-title">設計師</span>
        <span></span>
      </div>
    </div>

    <div v-if="loading" class="loading" style="padding-top:60px;">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!stylist" class="empty-state" style="padding-top:60px;">
      <div class="empty-state-icon">&#128566;</div>
      <p>找不到此設計師</p>
      <router-link to="/" class="btn btn-primary" style="margin-top:16px;">回首頁</router-link>
    </div>

    <div v-else class="container page-content">
      <!-- 個人資訊區 -->
      <div class="profile-section card">
        <div class="profile-header">
          <div class="profile-avatar">
            <img v-if="stylist.avatar" :src="stylist.avatar" :alt="stylist.name" />
            <span v-else class="avatar-placeholder">{{ stylist.name?.charAt(0) }}</span>
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ stylist.name }}</h1>
            <router-link
              v-if="stylist.storeId"
              :to="`/s/${stylist.storeId.slug}`"
              class="store-link"
            >
              {{ stylist.storeId.name }}
            </router-link>
            <RatingStars
              :rating="stylist.rating?.average || 0"
              :count="stylist.rating?.count || 0"
              :showAverage="true"
            />
          </div>
        </div>

        <!-- 專長標籤 -->
        <div v-if="stylist.specialties?.length" class="specialties">
          <span v-for="tag in stylist.specialties" :key="tag" class="specialty-tag">{{ tag }}</span>
        </div>

        <!-- 自我介紹 -->
        <p v-if="stylist.bio" class="bio">{{ stylist.bio }}</p>

        <!-- 社群連結 -->
        <div v-if="hasSocialLinks" class="social-links">
          <a v-if="stylist.socialLinks?.instagram" :href="formatIgLink(stylist.socialLinks.instagram)" target="_blank" rel="noopener" class="social-btn ig">
            IG
          </a>
          <a v-if="stylist.socialLinks?.facebook" :href="stylist.socialLinks.facebook" target="_blank" rel="noopener" class="social-btn fb">
            FB
          </a>
          <a v-if="stylist.socialLinks?.line" :href="`https://line.me/R/ti/p/${stylist.socialLinks.line}`" target="_blank" rel="noopener" class="social-btn line-btn">
            LINE
          </a>
        </div>
      </div>

      <!-- 作品集區 -->
      <section v-if="stylist.portfolio?.length" class="section">
        <h2 class="section-title">作品集</h2>
        <div class="gallery-grid">
          <div
            v-for="(item, i) in stylist.portfolio"
            :key="item._id"
            class="gallery-item"
            @click="openLightbox(i)"
          >
            <img :src="item.thumbnailUrl || item.imageUrl" :alt="item.title" loading="lazy" />
          </div>
        </div>
      </section>

      <!-- Lightbox -->
      <div v-if="lightboxIndex !== null" class="lightbox-overlay" @click.self="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">&times;</button>
        <button v-if="lightboxIndex > 0" class="lightbox-nav prev" @click="lightboxIndex--">&lsaquo;</button>
        <div class="lightbox-content">
          <img :src="stylist.portfolio[lightboxIndex].imageUrl" :alt="stylist.portfolio[lightboxIndex].title" />
          <p v-if="stylist.portfolio[lightboxIndex].title" class="lightbox-title">
            {{ stylist.portfolio[lightboxIndex].title }}
          </p>
        </div>
        <button v-if="lightboxIndex < stylist.portfolio.length - 1" class="lightbox-nav next" @click="lightboxIndex++">&rsaquo;</button>
      </div>

      <!-- 服務與價格 -->
      <section v-if="services.length" class="section">
        <h2 class="section-title">服務項目</h2>
        <div class="service-list">
          <div v-for="svc in services" :key="svc._id" class="service-card" @click="bookWithService(svc)">
            <div>
              <div class="service-name">{{ svc.name }}</div>
              <div class="service-info">{{ svc.duration }} 分鐘</div>
            </div>
            <div class="service-price">{{ formatPrice(svc) }}</div>
          </div>
        </div>
      </section>

      <!-- 預約按鈕 -->
      <div class="booking-cta">
        <button class="btn btn-primary btn-lg btn-block" @click="goBook">
          立即預約
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../utils/api'
import { formatPrice } from '../../utils/format'
import RatingStars from '../../components/RatingStars.vue'

const route = useRoute()
const router = useRouter()

const stylist = ref(null)
const services = ref([])
const loading = ref(true)
const lightboxIndex = ref(null)

const hasSocialLinks = computed(() => {
  const links = stylist.value?.socialLinks
  return links && (links.instagram || links.facebook || links.line)
})

onMounted(async () => {
  try {
    const { data } = await api.get(`/discover/stylists/${route.params.slugOrId}`)
    stylist.value = data
    services.value = data.services || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function formatIgLink(ig) {
  if (ig.startsWith('http')) return ig
  // Handle @username or plain username
  const username = ig.replace(/^@/, '')
  return `https://www.instagram.com/${username}`
}

function openLightbox(i) { lightboxIndex.value = i }
function closeLightbox() { lightboxIndex.value = null }

function goBook() {
  if (!stylist.value?.storeId?.slug) return
  router.push({
    path: `/s/${stylist.value.storeId.slug}/booking`,
    query: { staffId: stylist.value._id }
  })
}

function bookWithService(svc) {
  if (!stylist.value?.storeId?.slug) return
  router.push({
    path: `/s/${stylist.value.storeId.slug}/booking`,
    query: { staffId: stylist.value._id, serviceId: svc._id }
  })
}
</script>

<style scoped>
.stylist-page {
  min-height: 100vh;
  background: var(--bg);
}
.back-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: var(--spacing-xs);
  color: var(--text);
}
.profile-section {
  margin-top: var(--spacing-md);
}
.profile-header {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--primary-light);
}
.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  color: var(--primary-dark);
}
.profile-info {
  flex: 1;
}
.profile-name {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 4px;
}
.store-link {
  display: inline-block;
  font-size: 0.875rem;
  color: var(--primary-dark);
  text-decoration: none;
  margin-bottom: 4px;
}
.store-link:hover {
  text-decoration: underline;
}
.specialties {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}
.specialty-tag {
  padding: 4px 10px;
  font-size: 0.8125rem;
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: var(--radius-full);
}
.bio {
  font-size: 0.9375rem;
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
  white-space: pre-line;
}
.social-links {
  display: flex;
  gap: var(--spacing-sm);
}
.social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  color: white;
  min-height: 32px;
}
.social-btn.ig {
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
}
.social-btn.fb {
  background: #1877f2;
}
.social-btn.line-btn {
  background: #06c755;
}
.section {
  padding: var(--spacing-md) 0;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.gallery-item {
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  background: var(--bg);
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}
.gallery-item:hover img {
  transform: scale(1.05);
}
.service-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.booking-cta {
  position: sticky;
  bottom: 0;
  padding: var(--spacing-md) 0;
  background: linear-gradient(transparent, var(--bg) 20%);
  padding-top: var(--spacing-xl);
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 10;
}
.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 2.5rem;
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  border-radius: var(--radius-md);
  z-index: 10;
}
.lightbox-nav.prev { left: var(--spacing-md); }
.lightbox-nav.next { right: var(--spacing-md); }
.lightbox-content {
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.lightbox-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}
.lightbox-title {
  color: white;
  margin-top: var(--spacing-sm);
  font-size: 0.9375rem;
}
</style>
