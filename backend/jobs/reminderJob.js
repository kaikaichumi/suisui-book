const cron = require('node-cron');
const { Booking, Store, Service, Staff } = require('../models');
const { sendBookingReminder } = require('../services/notificationService');

function startReminderJob() {
  // 每小時執行一次，檢查 24 小時內的預約發送提醒
  cron.schedule('0 * * * *', async () => {
    console.log('[ReminderJob] 開始檢查待提醒預約...');

    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 找出 24 小時內、有 Email、尚未發送提醒的預約
      const bookings = await Booking.find({
        date: { $gte: now, $lte: in24h },
        status: { $in: ['pending', 'confirmed'] },
        customerEmail: { $ne: '' },
        reminderSent: false
      })
        .populate('storeId')
        .populate('serviceId')
        .populate('staffId');

      console.log(`[ReminderJob] 找到 ${bookings.length} 筆待提醒預約`);

      for (const booking of bookings) {
        if (!booking.storeId || !booking.serviceId || !booking.staffId) continue;

        try {
          await sendBookingReminder(booking, booking.storeId, booking.serviceId, booking.staffId);
          booking.reminderSent = true;
          await booking.save();
        } catch (err) {
          console.error(`[ReminderJob] 提醒發送失敗 (${booking._id}):`, err.message);
        }
      }

      console.log('[ReminderJob] 提醒檢查完成');
    } catch (error) {
      console.error('[ReminderJob] 執行錯誤:', error.message);
    }
  });

  console.log('[ReminderJob] 預約提醒排程已啟動（每小時執行）');
}

module.exports = { startReminderJob };
