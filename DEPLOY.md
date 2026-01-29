# SuiSui Book 部署指南：群暉 NAS + Cloudflare

> 本指南說明如何將系統部署到群暉 NAS，並透過 Cloudflare Tunnel 安全對外服務。

---

## 目錄

1. [架構說明](#架構說明)
2. [Step 1: MongoDB Atlas 設定](#step-1-mongodb-atlas-設定)
3. [Step 2: 準備部署檔案](#step-2-準備部署檔案)
4. [Step 3: 群暉 NAS 部署](#step-3-群暉-nas-部署)
5. [Step 4: Cloudflare Tunnel 設定](#step-4-cloudflare-tunnel-設定)
6. [Step 5: 驗證與測試](#step-5-驗證與測試)
7. [常見問題](#常見問題)

---

## 架構說明

```
用戶瀏覽器
    ↓ HTTPS
Cloudflare CDN (自動 SSL + DDoS 防護)
    ↓ Cloudflare Tunnel (加密通道)
群暉 NAS
    ├── Frontend 容器 (Nginx:80)
    │       ↓ /api 請求
    └── Backend 容器 (Node:5000)
              ↓
        MongoDB Atlas (雲端資料庫)
```

**優點：**
- 不需要開放 NAS 任何 Port
- 自動 HTTPS 憑證
- Cloudflare 免費 DDoS 防護
- 資料庫託管在雲端，自動備份

---

## Step 1: MongoDB Atlas 設定

### 1.1 建立帳號與 Cluster

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 註冊/登入
2. 建立新 Project：`suisui-book`
3. 建立 Cluster：
   - 選擇 **FREE (M0)** 方案
   - Provider: **AWS**
   - Region: **ap-northeast-1 (Tokyo)** 或 **ap-east-1 (Hong Kong)**
   - Cluster Name: `suisui-cluster`

### 1.2 設定資料庫用戶

1. 左側選單 → **Database Access**
2. **Add New Database User**
   - Authentication: Password
   - Username: `suisui-app`
   - Password: 點擊 **Auto Generate** 並**複製保存**
   - Database User Privileges: **Read and write to any database**
3. **Add User**

### 1.3 設定網路存取

1. 左側選單 → **Network Access**
2. **Add IP Address**
3. 選擇 **Allow Access from Anywhere** (0.0.0.0/0)
   > ⚠️ 生產環境建議設定特定 IP，但 Cloudflare Tunnel 的出口 IP 會變動，所以先開放全部
4. **Confirm**

### 1.4 取得連線字串

1. 左側選單 → **Database** → **Connect**
2. 選擇 **Connect your application**
3. Driver: **Node.js**
4. 複製連線字串，格式如下：

```
mongodb+srv://suisui-app:<password>@suisui-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. 將 `<password>` 替換為步驟 1.2 的密碼
6. 加上資料庫名稱：

```
mongodb+srv://suisui-app:你的密碼@suisui-cluster.xxxxx.mongodb.net/suisui-book?retryWrites=true&w=majority
```

**保存這個連線字串，稍後會用到！**

---

## Step 2: 準備部署檔案

### 2.1 建立環境變數檔案

在專案根目錄建立 `.env` 檔案（**不要上傳到 Git**）：

```bash
# === 必填 ===
MONGODB_URI=mongodb+srv://suisui-app:你的密碼@suisui-cluster.xxxxx.mongodb.net/suisui-book?retryWrites=true&w=majority
JWT_SECRET=產生一個32位以上的隨機字串

# === 選填（可稍後設定）===
# Sentry 錯誤監控
SENTRY_DSN_BACKEND=
SENTRY_ENVIRONMENT=production

# LINE 登入（需先申請 LINE Login Channel）
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CALLBACK_URL=https://你的網域/auth/line/callback

# Email 通知（SMTP）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=SuiSui Book <noreply@你的網域>
```

**產生 JWT_SECRET 的方法：**

```bash
# 在終端機執行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.2 建立前端環境變數

建立 `frontend/.env.production` 檔案：

```bash
VITE_API_URL=
VITE_LINE_CHANNEL_ID=
VITE_LINE_CALLBACK_URL=https://你的網域/auth/line/callback
VITE_SENTRY_DSN=
```

> 注意：`VITE_API_URL` 留空，因為 Nginx 會代理到 `/api`

---

## Step 3: 群暉 NAS 部署

### 3.1 上傳專案到 NAS

**方法 A：使用 Git（推薦）**

1. SSH 登入 NAS 或使用 Web Terminal
2. 建立專案目錄：
   ```bash
   mkdir -p /volume1/docker/suisui-book
   cd /volume1/docker/suisui-book
   ```
3. Clone 專案（或從本機上傳）：
   ```bash
   git clone 你的Git倉庫網址 .
   ```

**方法 B：使用 File Station**

1. 開啟 File Station
2. 在 `docker` 資料夾建立 `suisui-book` 資料夾
3. 將整個專案上傳到該資料夾

### 3.2 上傳環境變數檔案

將以下檔案上傳到 NAS 的 `/volume1/docker/suisui-book/`：
- `.env`（根目錄環境變數）
- `frontend/.env.production`

### 3.3 使用 Container Manager 部署

#### 方法 A：使用 SSH（推薦）

```bash
cd /volume1/docker/suisui-book

# 建置並啟動容器
docker-compose up -d --build

# 查看運行狀態
docker-compose ps

# 查看日誌
docker-compose logs -f
```

#### 方法 B：使用 Container Manager UI

1. 開啟 **Container Manager**
2. 左側選單 → **專案**
3. **建立** → **建立專案**
4. 專案名稱：`suisui-book`
5. 路徑：`/volume1/docker/suisui-book`
6. 來源：選擇 **docker-compose.yml**
7. **下一步** → **完成**

### 3.4 驗證容器運行

在 NAS 內部測試：

```bash
# 測試 Backend
curl http://localhost:5000/health

# 測試 Frontend
curl http://localhost:3000
```

---

## Step 4: Cloudflare Tunnel 設定

### 4.1 建立 Tunnel

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇你的網域
3. 左側選單 → **Zero Trust**
4. **Networks** → **Tunnels**
5. **Create a tunnel**
6. Tunnel name: `suisui-nas`
7. **Save tunnel**

### 4.2 安裝 Cloudflared 到 NAS

複製 Cloudflare 提供的 Token，然後在 NAS 上執行：

**方法 A：Docker 方式（推薦）**

在專案根目錄的 `docker-compose.yml` 加入 cloudflared 服務：

```yaml
# 已更新到 docker-compose.yml，見下方
```

**方法 B：直接安裝**

```bash
# 下載 cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# 安裝服務
cloudflared service install 你的TOKEN
```

### 4.3 設定路由

回到 Cloudflare Tunnel 設定頁面：

1. **Public Hostnames** → **Add a public hostname**
2. 設定如下：

| 欄位 | 值 |
|------|-----|
| Subdomain | `book`（或留空用根網域） |
| Domain | `你的網域.com` |
| Type | `HTTP` |
| URL | `frontend:80` |

3. **Save hostname**

### 4.4 SSL/TLS 設定

1. 回到 Cloudflare Dashboard → 你的網域
2. **SSL/TLS** → **Overview**
3. 選擇 **Full (strict)**

---

## Step 5: 驗證與測試

### 5.1 基本測試

1. 開啟瀏覽器，訪問 `https://book.你的網域.com`（或你設定的網域）
2. 應該看到 SuiSui Book 首頁

### 5.2 建立第一個 Super Admin

**方法 A：使用 Seed 腳本（推薦）**

```bash
# 進入 backend 容器
docker-compose exec backend sh

# 執行 seed 腳本
node scripts/seed-superadmin.js

# 或指定帳密
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=MySecurePass123 node scripts/seed-superadmin.js
```

腳本會顯示建立的帳號密碼，請記下來！

**方法 B：直接在 MongoDB Atlas 建立**

1. MongoDB Atlas → **Browse Collections**
2. 選擇 `superadmins` collection（如果沒有會自動建立）
3. **Insert Document**：

```json
{
  "email": "admin@example.com",
  "password": "$2a$10$這裡放bcrypt加密後的密碼",
  "name": "系統管理員"
}
```

產生 bcrypt 密碼：
```bash
node -e "console.log(require('bcryptjs').hashSync('你的密碼', 10))"
```

### 5.3 建立第一個店家

1. 訪問 `https://你的網域/superadmin/login`
2. 用剛剛建立的 Super Admin 帳號登入
3. 點擊「新增店家」建立第一個店家

### 5.4 測試 API

```bash
# 健康檢查
curl https://你的網域/api/health

# 應該返回
{"status":"ok","timestamp":"..."}
```

---

## 常見問題

### Q: 容器啟動失敗，顯示 MongoDB 連線錯誤

**A:** 檢查以下項目：
1. `.env` 中的 `MONGODB_URI` 是否正確
2. MongoDB Atlas Network Access 是否允許 0.0.0.0/0
3. 密碼中的特殊字符需要 URL encode

### Q: Cloudflare Tunnel 無法連線

**A:** 檢查以下項目：
1. cloudflared 容器是否正常運行：`docker-compose logs cloudflared`
2. Token 是否正確
3. Public hostname 的 URL 是否指向正確的容器名稱

### Q: 網站可以訪問但 API 返回 502

**A:** 通常是 Backend 容器問題：
1. 檢查 Backend 日誌：`docker-compose logs backend`
2. 確認 MongoDB 連線正常
3. 確認環境變數已正確載入

### Q: 如何更新部署？

```bash
cd /volume1/docker/suisui-book

# 拉取最新程式碼
git pull

# 重新建置並啟動
docker-compose up -d --build

# 如果只改了程式碼，沒改 Dockerfile
docker-compose up -d --build --no-deps backend frontend
```

### Q: 如何查看日誌？

```bash
# 所有服務
docker-compose logs -f

# 特定服務
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Q: 如何備份資料？

MongoDB Atlas 提供自動備份（付費版），免費版需要手動：

1. MongoDB Atlas → Database → **...** → **Command Line Tools**
2. 複製 `mongodump` 指令執行備份

---

## 附錄：檔案清單

部署需要的檔案：

```
suisui-book/
├── .env                    # 環境變數（不上傳 Git）
├── docker-compose.yml      # Docker 編排
├── backend/
│   ├── Dockerfile
│   └── ...
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── .env.production    # 前端環境變數
    └── ...
```
