const rateLimit = require('express-rate-limit');

// 全局限速：15 分鐘 300 次
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 300,
  message: { message: '請求過於頻繁，請稍後再試' },
  standardHeaders: true,
  legacyHeaders: false
});

// 登入限速：15 分鐘 10 次
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: '登入嘗試過於頻繁，請 15 分鐘後再試' },
  standardHeaders: true,
  legacyHeaders: false
});

// 預約建立限速：15 分鐘 20 次
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: '預約請求過於頻繁，請稍後再試' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  globalLimiter,
  loginLimiter,
  bookingLimiter
};
