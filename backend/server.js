require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const { globalLimiter } = require('./middleware/rateLimit');

// 初始化 Sentry
if (process.env.SENTRY_DSN_BACKEND) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: 0.2
  });
}

// 路由
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const superadminRoutes = require('./routes/superadmin');
const authRoutes = require('./routes/auth');
const { startReminderJob } = require('./jobs/reminderJob');

const app = express();

// 連接資料庫
connectDB();

// 中介層
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

// API 路由
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/auth', authRoutes);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sentry 錯誤處理
if (process.env.SENTRY_DSN_BACKEND) {
  Sentry.setupExpressErrorHandler(app);
}

// 錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '伺服器錯誤' });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // 啟動預約提醒排程
  startReminderJob();
});
