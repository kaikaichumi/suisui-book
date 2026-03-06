# SuiSui Book 平台擴展計畫

> 從店家預約工具 → 探索型預約平台（類似 Pikki）

## 目標

將 SuiSui Book 從「以店家為中心」的預約系統，擴展為使用者可主動探索的預約平台：

- 依照地理位置搜尋附近的設計師/美甲師
- 瀏覽設計師作品集做為參考
- 查看設計師所屬店家/工作室
- 選擇後進入預約流程
- 透過 LINE 官方帳號收到預約通知

**現有技術棧**：Vue 3 + Express.js + MongoDB，已有 LINE OAuth 登入、Email 通知、完整的預約流程。

---

## Phase 1：探索基礎建設（核心 MVP）✅ 已完成

### 1.1 資料庫模型修改與新增

#### 修改 `Store.js` — 加入地理位置 + 封面照 + 服務類別
- `location`（GeoJSON Point，支援 `2dsphere` 索引）
- `coverImage`（Cloudinary URL）
- `categories`（ObjectId[] → ServiceCategory）
- `notificationSettings`（email/line 開關）

#### 修改 `Staff.js` — 擴展為設計師個人檔案
- `slug`（unique, sparse）— 設計師個人頁面 URL
- `avatar`、`bio`、`specialties`
- `categories`（ObjectId[] → ServiceCategory）
- `socialLinks`（instagram, facebook, line）
- `rating`（average, count）
- `featured`、`discoverable`

#### 新建 `ServiceCategory.js` — 平台級服務分類
- 欄位：name, nameEn, slug, icon, description, sortOrder, active
- 初始分類：美髮、美甲、美睫、護膚、美體按摩、紋繡

#### 新建 `Portfolio.js` — 設計師作品圖片集
- `staffId`, `storeId`, `imageUrl`, `thumbnailUrl`
- `title`, `description`, `category`, `tags`
- `sortOrder`, `active`

#### 修改 `Service.js` — 價格範圍支援
- `price`（單一價格）→ `priceMin`（必填）+ `priceMax`（選填）
- `priceMax` 為 null 代表固定價格
- 保留 virtual `price` getter 向後相容

### 1.2 圖片上傳服務（Cloudinary）

- `POST /api/upload/image` — multer + cloudinary
- 回傳 `{ url, thumbnailUrl, publicId }`
- 環境變數：`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 1.3 探索 API（`/api/discover`）

| Endpoint | 說明 |
|----------|------|
| `GET /categories` | 列出所有啟用的服務分類 |
| `GET /stylists` | 搜尋設計師（geo + 分類 + 關鍵字 + 評分 + 分頁） |
| `GET /stylists/featured` | 推薦設計師列表 |
| `GET /stylists/:slugOrId` | 設計師完整個人檔案（含作品集） |
| `GET /stores/nearby` | 搜尋附近店家 |

**搜尋邏輯**：
1. lat/lng → Store `2dsphere` 索引找附近店家
2. 店家 IDs + 篩選條件查詢 Staff
3. 每位設計師附帶 3 張作品集縮圖預覽
4. 支援 `sort=rating|distance|newest` 排序

### 1.4 Admin 端：設計師檔案管理

- `PUT /api/admin/staff/:id/profile` — 更新設計師個人檔案
- 作品集 CRUD（`GET/POST/PUT/DELETE /api/admin/staff/:id/portfolio`）
- 店家位置設定（地址轉座標）
- 服務項目價格範圍設定（最低價 + 最高價）

### 1.5 前端新頁面

#### `DiscoveryPage.vue` — 平台首頁
- Hero 搜尋列 + 定位按鈕（Browser Geolocation API）
- 分類選擇（水平滾動圖示列 `CategoryPills`）
- 推薦設計師（`StylistCard` 卡片列表 + 作品縮圖）

#### `StylistPage.vue` — 設計師個人頁面 `/stylist/:slugOrId`
- 個人資訊、評分、所屬店家、自我介紹、專長
- IG / 社群連結
- 作品集 Grid 圖庫（點擊放大 lightbox）
- 服務與價格（支援價格範圍顯示）
- 「立即預約」→ 進入預約流程

#### `Categories.vue` — SuperAdmin 分類管理

### 1.6 前端元件

| 元件 | 用途 |
|------|------|
| `StylistCard.vue` | 設計師卡片（頭像、評分、店家、作品預覽） |
| `CategoryPills.vue` | 分類選擇列 |
| `RatingStars.vue` | 星級評分顯示 |
| `PortfolioManager.vue` | 作品集管理 |
| `ImageUploader.vue` | 圖片上傳元件 |

### 1.7 路由調整

```
/ → DiscoveryPage（首頁）
/stylist/:slugOrId → StylistPage
/s/:slug → StorePage（原有，保留向下相容）
/admin/* → 管理後台（原有）
/superadmin/* → 超級管理後台（原有）
```

### 1.8 預約流程銜接

- `BookingPage.vue` 接受 `preSelectedStaffId`
- 若已預選設計師：顯示該設計師的服務 → 跳過人員選擇 → 直接進日期時間
- 原有 `/s/:slug/booking` 流程不受影響

### 1.9 資料遷移

`backend/scripts/migrate-phase1.js`：
- 為現有 Store 加上 `location`, `notificationSettings` 預設值
- 為現有 Staff 加上 `discoverable`, `rating` 等預設值
- 建立 6 個初始 ServiceCategory 種子資料
- 遷移 Service `price` → `priceMin`，清理舊欄位

---

## Phase 2：LINE 通知 & 評價系統（待開發）

### 2.1 LINE Messaging API 整合（平台統一帳號）

- 使用一個 SuiSui Book 平台級 LINE Official Account 發送所有通知
- 環境變數：`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`, `LINE_MESSAGING_CHANNEL_SECRET`
- 顧客透過 LINE Login 加入後，即可接收推播

**新建 `backend/services/lineService.js`**：
- `sendLinePushMessage(toUserId, messages)` — 推播訊息
- Flex Message 範本：預約確認、取消通知、提醒通知
- Webhook 簽名驗證

**新建 `backend/routes/lineWebhook.js`**：
- `POST /api/webhook/line` — 處理 follow 事件等

### 2.2 通知系統重構

**新建 `backend/models/NotificationLog.js`**：
- 通知佇列：bookingId, type, channel, status, attempts, lastError
- 重試機制（最多 3 次，指數退避）

**修改 `notificationService.js`**：
- 原有 email 保留 + 新增 LINE 推播
- 根據 `store.notificationSettings` 決定管道
- 非同步佇列模式

### 2.3 通知流程

1. 預約建立 → 寫入 NotificationLog（email + line）
2. Cron Job 每分鐘處理 pending 通知
3. 顧客收到 LINE 推播確認，店家收到 email/LINE 通知

### 2.4 Admin 通知設定

- 各事件通知管道切換（新預約、取消：email/LINE）
- 店家 email 設定

### 2.5 評價系統

**新建 `backend/models/Review.js`**：
- bookingId(unique), staffId, storeId, customerId
- rating(1-5), comment, images, visible, reply
- Post-save hook 自動更新 Staff.rating

**API**：
- `POST /api/stores/:slug/bookings/:id/review` — 顧客提交評價
- `GET /api/discover/stylists/:id/reviews` — 評價列表
- `POST /api/admin/reviews/:id/reply` — 店家回覆

---

## Phase 3：進階功能與優化（未來規劃）

- Featured 設計師管理（SuperAdmin 標記）
- 進階搜尋：價格範圍、可預約日期、距離滑桿
- 分類瀏覽頁 `/category/:slug`
- 地圖模式探索（Leaflet.js）
- 完成預約後自動發送評價邀請
- 顧客收藏設計師
- 設計師可用時段在個人頁面顯示

---

## 架構決策

| 決策 | 選擇 | 原因 |
|------|------|------|
| 圖片儲存 | Cloudinary | 免費 25GB + CDN + 自動縮圖 |
| 地理搜尋 | MongoDB 2dsphere | 現有技術棧、千級店家量足夠 |
| 通知佇列 | MongoDB + node-cron | 延續現有模式、不需 Redis |
| 設計師模型 | 擴展現有 Staff | 保留既有關聯、避免遷移複雜度 |
| LINE 通知 | 平台統一 LINE OA | 設定簡單、顧客 LINE Login 即可推播 |
| 價格模型 | priceMin + priceMax | 支援固定價與範圍價，virtual getter 向後相容 |

---

## 關鍵檔案清單

### Phase 1 已修改的檔案

| 檔案 | 修改內容 |
|------|----------|
| `backend/models/Store.js` | location, coverImage, categories, notificationSettings |
| `backend/models/Staff.js` | slug, avatar, bio, specialties, categories, socialLinks, rating, featured, discoverable |
| `backend/models/Service.js` | price → priceMin + priceMax，virtual price getter |
| `backend/models/index.js` | 匯出新 models |
| `backend/server.js` | 掛載 discover, upload 路由 |
| `backend/routes/admin.js` | 設計師檔案 + 作品集 CRUD + 價格範圍 |
| `backend/routes/api.js` | populate priceMin priceMax |
| `backend/routes/superadmin.js` | populate priceMin priceMax |
| `backend/validations/service.js` | Joi schemas 支援 priceMin/priceMax |
| `frontend/src/router/index.js` | 探索頁、設計師頁路由 |
| `frontend/src/utils/format.js` | formatPrice 支援價格範圍 |
| `frontend/src/views/admin/Settings.vue` | 位置設定 |
| `frontend/src/views/admin/Staff.vue` | 設計師檔案編輯 |
| `frontend/src/views/admin/Services.vue` | 價格範圍表單 |
| `frontend/src/views/customer/BookingPage.vue` | 預選設計師、價格範圍顯示 |
| `frontend/src/views/customer/StorePage.vue` | formatPrice(service) |
| `frontend/src/views/customer/MyBookings.vue` | formatPrice(booking.serviceId) |
| `frontend/src/components/BookingCard.vue` | formatPrice + priceMin 判斷 |
| `frontend/vite.config.js` | host: 127.0.0.1 + proxy target fix |

### Phase 1 新建的檔案

| 檔案 | 用途 |
|------|------|
| `backend/models/ServiceCategory.js` | 平台服務分類 |
| `backend/models/Portfolio.js` | 設計師作品集 |
| `backend/config/cloudinary.js` | Cloudinary 設定 |
| `backend/routes/discover.js` | 探索搜尋 API |
| `backend/routes/upload.js` | 圖片上傳 |
| `backend/scripts/migrate-phase1.js` | 資料遷移腳本 |
| `frontend/src/views/customer/DiscoveryPage.vue` | 探索首頁 |
| `frontend/src/views/customer/StylistPage.vue` | 設計師個人頁 |
| `frontend/src/views/superadmin/Categories.vue` | 分類管理 |
| `frontend/src/components/StylistCard.vue` | 設計師卡片 |
| `frontend/src/components/CategoryPills.vue` | 分類選擇列 |
| `frontend/src/components/RatingStars.vue` | 星級評分 |
| `frontend/src/components/PortfolioManager.vue` | 作品集管理 |
| `frontend/src/components/ImageUploader.vue` | 圖片上傳元件 |
