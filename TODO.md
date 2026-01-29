# SuiSui Book 美容預約系統 - 產品化待辦事項

> 本文件記錄系統要作為市場可販售產品所需完善的功能與改進項目。
>
> 最後更新：2026-01-29

---

## 目錄

- [一、安全性強化](#一安全性強化)
- [二、支付系統](#二支付系統)
- [三、通知系統](#三通知系統)
- [四、會員系統](#四會員系統)
- [五、評價系統](#五評價系統)
- [六、行銷功能](#六行銷功能)
- [七、報表與數據分析](#七報表與數據分析)
- [八、進階排班功能](#八進階排班功能)
- [九、多語言與本地化](#九多語言與本地化)
- [十、行動端支援](#十行動端支援)
- [十一、技術層面完善](#十一技術層面完善)
- [十二、法規合規](#十二法規合規)
- [十三、營運功能](#十三營運功能)
- [優先順序建議](#優先順序建議)
- [部署規劃](#部署規劃)

---

## 一、安全性強化

> 重要性標示：🔴 必要 | 🟡 重要 | 🟢 建議

| 狀態 | 項目 | 說明 | 重要性 |
|:---:|------|------|:------:|
| [ ] | HTTPS/SSL | 生產環境必須加密傳輸，透過 Cloudflare 自動處理 | 🔴 |
| [x] | Rate Limiting | API 速率限制，防止暴力破解攻擊（建議使用 express-rate-limit） | 🔴 |
| [ ] | 密碼強度驗證 | 要求密碼包含大小寫、數字、特殊字符，最少 8 字元 | 🟡 |
| [ ] | 登入失敗鎖定 | 連續 5 次失敗後鎖定帳號 15 分鐘 | 🟡 |
| [ ] | CSRF Token | 跨站請求偽造防護（建議使用 csurf） | 🟡 |
| [ ] | 審計日誌 | 記錄所有重要操作（登入、修改、刪除等） | 🟡 |
| [x] | 輸入驗證強化 | 後端使用 Joi 或 Zod 進行嚴格輸入驗證 | 🟡 |
| [ ] | SQL/NoSQL 注入防護 | 確保所有查詢使用參數化，避免注入攻擊 | 🔴 |
| [ ] | XSS 防護 | 前端輸出轉義，CSP 標頭設定 | 🟡 |
| [ ] | 敏感資料加密 | 顧客電話等敏感資料加密存儲 | 🟡 |

### 實作建議

```bash
# 安裝相關套件
npm install express-rate-limit helmet csurf joi
```

```javascript
// Rate Limiting 範例
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 最多 100 次請求
  message: '請求過於頻繁，請稍後再試'
});
app.use('/api/', limiter);
```

---

## 二、金額顯示（不做線上支付）

> 不整合線上支付系統，僅在前端顯示服務金額，現場收費

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [x] | 服務價格顯示 | 預約頁面、店家頁面清楚顯示各服務價格 |
| [x] | 預約金額小計 | 預約確認時顯示總金額供顧客參考 |
| [x] | 價格格式化 | 統一貨幣格式（NT$ x,xxx） |
| [ ] | 價格異動通知 | 價格調整時通知已預約顧客（未來可選） |

> **備註**：線上支付功能（綠界、LINE Pay 等）視未來業務需求再行評估

---

## 三、通知系統

> 採用 Email + LINE OA 雙管道，不使用 SMS（降低成本）

### Email 通知

| 狀態 | 項目 | 說明 | 建議方案 |
|:---:|------|------|---------|
| [x] | Email 服務整合 | 寄送預約相關通知信 | Nodemailer + SMTP |
| [x] | Email 模板設計 | 預約確認、提醒、取消等模板 | HTML Email 模板 |
| [x] | 自動提醒排程 | 預約前 24 小時自動發送提醒 | node-cron |
| [ ] | 通知歷史記錄 | 記錄所有已發送的通知 | 新增 Notification Model |

### LINE OA 通知（需綁定 LINE 帳號）

| 狀態 | 項目 | 說明 | 建議方案 |
|:---:|------|------|---------|
| [ ] | LINE OA 申請 | 申請 LINE Official Account | LINE Business |
| [ ] | LINE Messaging API 整合 | 發送通知訊息給已綁定用戶 | @line/bot-sdk |
| [ ] | LINE 推播模板 | Flex Message 設計 | LINE Flex Message Simulator |
| [ ] | 綁定狀態判斷 | 未綁定 LINE 者僅發 Email | 通知服務邏輯 |

### 通知時機規劃

| 事件 | Email | LINE（已綁定） |
|-----|:-----:|:-------------:|
| 預約成功 | ✅ | ✅ |
| 預約前 24 小時提醒 | ✅ | ✅ |
| 預約前 2 小時提醒 | - | ✅ |
| 預約取消 | ✅ | ✅ |
| 預約變更 | ✅ | ✅ |
| 服務完成（邀請評價） | ✅ | ✅ |

### 通知邏輯

```
顧客預約
  ├── 有綁定 LINE → Email + LINE 雙通道通知
  └── 未綁定 LINE → 僅 Email 通知
```

---

## 四、預約與會員系統

> 預約不強制註冊會員，店家可自行決定是否開啟會員/集點功能

### 預約方式（二擇一）

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [x] | LINE 登入預約 | 透過 LINE OAuth 登入後直接預約 |
| [x] | 免登入預約 | 填寫姓名 + 手機號碼即可預約（現有功能） |

### LINE 登入整合

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | LINE Login Channel 申請 | LINE Developers Console 建立（需手動申請） |
| [x] | LINE OAuth 2.0 流程 | 前端跳轉授權 → 後端取得 userId/名稱/頭像 |
| [x] | 自動帶入資料 | LINE 登入後自動帶入姓名，免重複填寫 |
| [x] | LINE 綁定記錄 | 記錄 LINE userId 以便後續推播通知 |

### 會員功能（店家可選擇開啟）

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | 會員開關設定 | 店家後台可開啟/關閉會員功能 |
| [ ] | 會員註冊 | 顧客可自行選擇是否註冊為會員 |
| [ ] | 會員額外資料 | 比一般預約多填 Email、生日 |
| [ ] | 會員中心頁面 | 查看個人資料、預約歷史 |
| [ ] | 個人資料編輯 | 修改姓名、電話、Email、生日 |

### 集點功能（店家可選擇開啟）

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | 集點開關設定 | 店家後台可開啟/關閉集點功能 |
| [ ] | 集點規則設定 | 店家自訂消費幾次/幾元可集一點 |
| [ ] | 點數累積 | 服務完成後自動累積點數 |
| [ ] | 點數查詢 | 會員可查看目前點數 |
| [ ] | 點數兌換規則 | 店家自訂兌換項目（如免費服務、折扣） |
| [ ] | 點數紀錄 | 累積/兌換歷史記錄 |

### 預約流程

```
顧客進入店家頁面
  ├── 選擇 LINE 登入 → 自動帶入姓名 → 選擇服務/時段 → 完成預約
  └── 不登入 → 手動填姓名+手機 → 選擇服務/時段 → 完成預約
              ↓
     預約完成後可選擇「註冊會員」（需補填 Email、生日）
```

---

## 五、評價系統

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | 服務評分 | 1-5 星評分機制 |
| [ ] | 文字評論 | 顧客留言功能 |
| [ ] | 評價審核 | 店家可檢舉不當評論 |
| [ ] | 店家回覆 | 店家可回覆顧客評價 |
| [ ] | 評價統計 | 平均分數、評價數量統計 |
| [ ] | 評價展示 | 店家頁面顯示評價 |
| [ ] | 評價提醒 | 服務完成後邀請評價 |
| [ ] | 匿名評價 | 可選擇匿名發表 |

### 數據模型建議

```javascript
// Review Model
{
  storeId: ObjectId,
  bookingId: ObjectId,
  customerId: ObjectId,
  staffId: ObjectId,
  serviceId: ObjectId,
  rating: Number,        // 1-5
  comment: String,
  isAnonymous: Boolean,
  storeReply: String,
  storeReplyAt: Date,
  status: String,        // 'pending', 'approved', 'hidden'
  createdAt: Date
}
```

---

## 六、行銷功能

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | 優惠券系統 | 折扣碼、滿減券、新客券 |
| [ ] | 優惠券管理後台 | 建立、編輯、停用優惠券 |
| [ ] | 優惠券使用限制 | 使用次數、有效期限、適用服務 |
| [ ] | 促銷活動 | 限時優惠、特價時段 |
| [ ] | 推薦獎勵 | 邀請好友獲得回饋 |
| [ ] | 推薦碼追蹤 | 追蹤推薦來源 |
| [ ] | 群發通知 | 向顧客群發行銷訊息 |
| [ ] | 行銷數據分析 | 優惠券使用率、轉換率統計 |

### 優惠券類型

| 類型 | 說明 | 範例 |
|-----|------|------|
| 折扣券 | 百分比折扣 | 全單 9 折 |
| 滿減券 | 滿額折抵 | 滿 $1000 折 $100 |
| 現金券 | 固定金額折抵 | 折抵 $50 |
| 新客券 | 首次消費專用 | 首單 8 折 |
| 生日券 | 生日當月專用 | 生日禮 $200 |

---

## 七、報表與數據分析

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | 營收報表 | 日/週/月/年營收統計 |
| [ ] | 預約分析 | 預約數量、尖峰時段、熱門服務 |
| [ ] | 取消率統計 | 取消原因分析 |
| [ ] | 員工績效 | 接客數、營收貢獻、平均評價 |
| [ ] | 顧客分析 | 新客/舊客比例、回訪率 |
| [ ] | 顧客流失預警 | 超過 N 天未消費提醒 |
| [ ] | 數據視覺化 | 圖表展示（Chart.js / ECharts） |
| [ ] | 數據導出 | Excel / CSV 匯出功能 |
| [ ] | 定期報表 | 每週/月自動生成報表 |

### 關鍵指標 (KPIs)

| 指標 | 說明 | 計算方式 |
|-----|------|---------|
| 預約轉換率 | 瀏覽 → 預約的比例 | 預約數 / 頁面瀏覽數 |
| 取消率 | 取消預約佔比 | 取消數 / 總預約數 |
| 回訪率 | 顧客再次消費比例 | 回訪顧客數 / 總顧客數 |
| 平均客單價 | 每筆訂單平均金額 | 總營收 / 訂單數 |
| 員工產能利用率 | 員工被預約時間佔比 | 已預約時段 / 可預約時段 |

---

## 八、進階排班功能

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | 員工班表管理 | 視覺化排班介面 |
| [ ] | 班別設定 | 早班/晚班/全天班 |
| [ ] | 自動排班建議 | 根據預約量建議人力配置 |
| [ ] | 休假申請 | 員工線上申請，主管審批 |
| [ ] | 調班功能 | 員工互換班表 |
| [ ] | 工時統計 | 自動計算每月工時 |
| [ ] | 加班管理 | 加班時數記錄與統計 |
| [ ] | 行事曆整合 | 匯出至 Google Calendar / iCal |

---

## 九、多語言與本地化

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | i18n 框架整合 | Vue I18n 整合 |
| [ ] | 繁體中文 | 預設語言（已完成） |
| [ ] | 簡體中文 | 大陸市場 |
| [ ] | 英文 | 國際化基礎 |
| [ ] | 語言切換 | 用戶可手動切換語言 |
| [ ] | 時區處理 | 支援不同地區時區 |
| [ ] | 貨幣設定 | TWD / CNY / USD 等 |
| [ ] | 日期格式 | 根據地區顯示不同格式 |

---

## 十、行動端支援

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [x] | RWD 響應式優化 | 確認所有頁面行動裝置體驗（管理後台+顧客預約頁面） |
| [ ] | PWA 支援 | Service Worker、離線使用 |
| [ ] | 安裝提示 | 提示用戶安裝到主畫面 |
| [ ] | App Icon | PWA 圖示設計 |
| [ ] | Splash Screen | 啟動畫面 |
| [ ] | 原生 App（可選） | React Native / Flutter |

### PWA 設定清單

| 項目 | 狀態 |
|-----|:----:|
| manifest.json | [ ] |
| Service Worker | [ ] |
| 離線頁面 | [ ] |
| App Icons (多尺寸) | [ ] |
| iOS meta tags | [ ] |

---

## 十一、技術層面完善

| 狀態 | 項目 | 現狀 | 建議方案 |
|:---:|------|:----:|---------|
| [ ] | 單元測試 | ❌ 無 | Jest + Vue Test Utils |
| [ ] | E2E 測試 | ❌ 無 | Cypress / Playwright |
| [ ] | API 測試 | ❌ 無 | Supertest |
| [x] | 錯誤監控 | ✅ 已整合 | Sentry（前後端皆已設定） |
| [ ] | 日誌系統 | ❌ 無 | Winston + 集中式日誌 |
| [ ] | API 文檔 | ❌ 無 | Swagger / OpenAPI |
| [ ] | 健康檢查增強 | 基本 | 增加 DB 連線狀態 |
| [ ] | CI/CD | ❌ 無 | GitHub Actions |
| [ ] | 效能監控 | ❌ 無 | 基本 APM |
| [ ] | 程式碼品質 | ❌ 無 | ESLint + Prettier |
| [ ] | Git Hooks | ❌ 無 | Husky + lint-staged |
| [ ] | 環境變數驗證 | ❌ 無 | dotenv-safe |

### 測試覆蓋率目標

| 類型 | 目標覆蓋率 |
|-----|-----------|
| 單元測試 | > 70% |
| API 測試 | > 80% |
| E2E 測試 | 關鍵流程 100% |

---

## 十二、法規合規

| 狀態 | 項目 | 說明 | 重要性 |
|:---:|------|------|:------:|
| [x] | 隱私權政策頁面 | 說明資料收集與使用方式 | 🔴 |
| [x] | 服務條款頁面 | 使用條款與免責聲明 | 🔴 |
| [ ] | 個資法合規 | 台灣個人資料保護法 | 🔴 |
| [ ] | GDPR 合規（如需） | 歐盟資料保護規範 | 🟡 |
| [ ] | Cookie 同意 | Cookie 使用告知與同意機制 | 🟡 |
| [ ] | 資料備份機制 | 定期自動備份 | 🔴 |
| [ ] | 災難復原計畫 | 資料遺失時的復原程序 | 🟡 |
| [ ] | 資料保留政策 | 定義資料保留期限 | 🟡 |
| [ ] | 資料刪除功能 | 用戶可要求刪除個人資料 | 🟡 |

---

## 十三、營運功能

| 狀態 | 項目 | 說明 |
|:---:|------|------|
| [ ] | 多分店管理 | 連鎖店統一管理介面 |
| [ ] | 分店數據獨立 | 各分店數據分離但可匯總 |
| [ ] | 權限細分 | 店長、員工、會計等不同權限 |
| [ ] | 操作權限管理 | 細粒度的功能權限控制 |
| [ ] | 庫存管理 | 美容耗材追蹤 |
| [ ] | 進貨管理 | 耗材進貨記錄 |
| [ ] | 薪資計算 | 底薪 + 抽成 + 獎金計算 |
| [ ] | 薪資報表 | 每月薪資明細報表 |

---

## 優先順序建議

### 第一階段：上線前必要（MVP+）

- [ ] HTTPS + Cloudflare 設定
- [x] Rate Limiting 實作
- [x] 基本輸入驗證強化（Joi）
- [x] 隱私權政策頁面
- [x] 服務條款頁面
- [x] 錯誤監控（Sentry）
- [x] LINE 登入整合（OAuth 2.0）
- [x] 基本 Email 通知（預約確認/提醒/取消）
- [x] 服務價格顯示與小計
- [x] RWD 響應式設計（桌面/行動裝置）

### 第二階段：會員與通知完善

- [ ] 會員功能（店家可開關）
- [ ] LINE OA 通知整合（已綁定用戶推播）
- [ ] 自動預約提醒排程
- [ ] 完整報表功能
- [ ] API 文檔

### 第三階段：競爭力提升

- [ ] 集點功能（店家可開關）
- [ ] 優惠券系統
- [ ] 進階排班系統
- [ ] 進階數據分析

---

## 部署規劃

### 現階段：群暉 NAS + Cloudflare

```
用戶 → Cloudflare CDN/DNS → Cloudflare Tunnel → 群暉 NAS
                ↓                                    ↓
          自動 HTTPS                          Docker 容器
          DDoS 防護                           ├── Frontend
          快取靜態資源                         ├── Backend
                                             └── MongoDB
```

**設定清單：**

| 項目 | 狀態 | 說明 |
|-----|:----:|------|
| Cloudflare 帳號 | [ ] | 註冊並新增網域 |
| 網域購買 | [ ] | 在 Cloudflare 購買 |
| DNS 設定 | [ ] | 指向 Tunnel |
| Cloudflare Tunnel | [ ] | 安裝 cloudflared |
| SSL/TLS 設定 | [ ] | 設為 Full (strict) |
| 快取規則 | [ ] | 靜態資源快取 |
| 防火牆規則 | [ ] | 基本防護規則 |

### 未來：雲端部署

待測試完成後，可選擇：
- Oracle Cloud 免費 ARM（成本最低）
- GCP Cloud Run（台灣節點，延遲最低）
- AWS（生態系最完整）

---

## 變更記錄

| 日期 | 變更內容 | 負責人 |
|-----|---------|-------|
| 2026-01-27 | 初始版本建立 | - |
| 2026-01-27 | 移除線上支付，改為僅顯示金額 | - |
| 2026-01-27 | 通知系統改為 Email + LINE OA（移除 SMS） | - |
| 2026-01-27 | 會員系統調整：LINE 登入、店家可開關會員/集點功能 | - |
| 2026-01-27 | 預約方式：LINE 登入 或 姓名+手機（免註冊） | - |
| 2026-01-29 | **第一階段實作完成**：Rate Limiting、Joi 驗證、隱私權/服務條款頁面、Sentry 錯誤監控、LINE 登入整合、Email 通知系統、價格顯示格式化 | Claude |
| 2026-01-29 | RWD 響應式設計：管理後台（AdminLayout 側邊欄/底部導航）、顧客預約頁面（桌面/行動裝置自適應） | Claude |
| 2026-01-29 | Bug 修復：Settings.vue API 端點、營業時間輸入框顯示問題 | Claude |

---

## 第一階段實作摘要（2026-01-29 完成）

### 新增檔案清單

**後端 (backend/)**
```
middleware/rateLimit.js      - Rate Limiting 中介層（全局/登入/預約）
middleware/validate.js       - Joi 驗證中介層
validations/auth.js          - 登入驗證 Schema
validations/booking.js       - 預約驗證 Schema
validations/service.js       - 服務 CRUD 驗證 Schema
validations/staff.js         - 人員 CRUD 驗證 Schema
models/Customer.js           - 顧客 Model（LINE 登入用戶）
routes/auth.js               - LINE OAuth 回調、顧客 API
services/emailService.js     - Nodemailer 郵件服務
services/notificationService.js - 通知調度服務
templates/emails/bookingConfirmation.js - 預約確認信模板
templates/emails/bookingReminder.js     - 預約提醒信模板
templates/emails/bookingCancellation.js - 取消通知信模板
jobs/reminderJob.js          - 預約提醒排程（node-cron）
```

**前端 (frontend/)**
```
src/views/legal/PrivacyPage.vue     - 隱私權政策頁面
src/views/legal/TermsPage.vue       - 服務條款頁面
src/views/customer/LineCallback.vue - LINE OAuth 回調頁面
src/components/AdminLayout.vue      - 管理後台響應式佈局
src/utils/format.js                 - 價格/日期格式化工具
.env.example                        - 前端環境變數範例
```

### 修改檔案清單

**後端**
- `server.js` - Sentry 整合、Rate Limiting、Auth 路由、Reminder Job
- `models/Booking.js` - 新增 customerId、customerEmail、reminderSent 欄位
- `models/index.js` - 匯出 Customer Model
- `middleware/auth.js` - 新增 verifyCustomer、optionalCustomerAuth
- `routes/api.js` - Joi 驗證、Rate Limiting、Email 通知觸發
- `routes/admin.js` - Joi 驗證、Rate Limiting、取消預約 Email
- `routes/superadmin.js` - Joi 驗證、Rate Limiting

**前端**
- `src/main.js` - Sentry 整合
- `src/router/index.js` - 新增 /privacy、/terms、/auth/line/callback 路由
- `src/stores/auth.js` - LINE 登入支援、顧客驗證
- `src/views/customer/StorePage.vue` - LINE 登入、價格格式、RWD
- `src/views/customer/BookingPage.vue` - LINE 登入、Email 欄位、價格格式、RWD
- `src/views/customer/MyBookings.vue` - 已登入自動查詢、RWD
- `src/views/admin/*.vue` - 全部改用 AdminLayout、RWD 響應式

### 新增 NPM 套件

**後端:** `express-rate-limit`, `joi`, `@sentry/node`, `axios`, `nodemailer`, `node-cron`
**前端:** `@sentry/vue`

### 新增環境變數

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300

# Sentry
SENTRY_DSN_BACKEND=
SENTRY_ENVIRONMENT=development

# LINE Login
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CALLBACK_URL=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# Frontend (.env)
VITE_LINE_CHANNEL_ID=
VITE_LINE_CALLBACK_URL=
VITE_SENTRY_DSN=
```

---

## 備註

- 本文件應隨專案進展持續更新
- 完成項目請將 `[ ]` 改為 `[x]`
- 如有新需求請新增至對應章節
