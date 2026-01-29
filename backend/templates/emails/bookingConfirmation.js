function bookingConfirmationTemplate({ storeName, serviceName, staffName, date, startTime, endTime, customerName }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 480px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 24px; text-align: center; }
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
      <h1>預約確認通知</h1>
    </div>
    <div class="content">
      <p>${customerName} 您好，</p>
      <p>您已成功預約 <strong>${storeName}</strong> 的服務，以下是預約詳情：</p>
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
      <p style="margin-top: 16px; color: #666;">預約狀態為「待確認」，店家確認後將另行通知。</p>
    </div>
    <div class="footer">
      此信件由 SuiSui Book 系統自動發送，請勿直接回覆。
    </div>
  </div>
</body>
</html>`;
}

module.exports = bookingConfirmationTemplate;
