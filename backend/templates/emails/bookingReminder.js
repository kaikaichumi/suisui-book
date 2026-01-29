function bookingReminderTemplate({ storeName, serviceName, staffName, date, startTime, endTime, customerName }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 480px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { padding: 24px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .info-label { color: #888; }
    .info-value { font-weight: 600; }
    .footer { padding: 16px 24px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>預約提醒</h1>
    </div>
    <div class="content">
      <p>${customerName} 您好，</p>
      <p>提醒您明天在 <strong>${storeName}</strong> 有一個預約：</p>
      <div class="info-row">
        <span class="info-label">服務項目</span>
        <span class="info-value">${serviceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">服務人員</span>
        <span class="info-value">${staffName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">日期</span>
        <span class="info-value">${date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">時間</span>
        <span class="info-value">${startTime} - ${endTime}</span>
      </div>
      <p style="margin-top: 16px; color: #666;">請準時到達，如需取消請提前操作。</p>
    </div>
    <div class="footer">
      此信件由 SuiSui Book 系統自動發送，請勿直接回覆。
    </div>
  </div>
</body>
</html>`;
}

module.exports = bookingReminderTemplate;
