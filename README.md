# 水水 SuiSui Book

多店家美容預約系統，支援美髮、美甲等服務預約管理。

## 功能特色

### 顧客端
- 瀏覽店家服務項目
- 選擇服務人員
- 選擇日期時段
- 線上預約
- 查詢/取消預約

### 店家後台
- 服務項目管理
- 服務人員管理（可勾選服務項目）
- 預約管理（確認/取消）
- 營業時間設定

### 超級管理員
- 店家帳號管理
- 全域預約總覽
- 系統統計

## 技術架構

- **前端**: Vue 3 + Vite + Pinia
- **後端**: Node.js + Express
- **資料庫**: MongoDB (Atlas)
- **部署**: Docker

## 快速開始

### 1. 環境準備

- Node.js 18+
- MongoDB Atlas 帳號（免費版即可）

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env` 填入你的 MongoDB 連線字串和 JWT 密鑰。

### 3. 安裝相依套件

```bash
# 後端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 4. 初始化管理員帳號

```bash
cd backend
npm run init-admin
```

### 5. 啟動開發伺服器

```bash
# 終端 1 - 後端
cd backend
npm run dev

# 終端 2 - 前端
cd frontend
npm run dev
```

前端: http://localhost:3000
後端: http://localhost:5000

## 部署

### Docker 部署

```bash
docker-compose up -d
```

### Render 部署

1. 建立 Web Service，連結此 repo
2. 設定環境變數
3. 部署

## 網址結構

- `/superadmin` - 超級管理員後台
- `/admin` - 店家後台
- `/s/店家代碼` - 顧客預約頁面

## License

MIT
