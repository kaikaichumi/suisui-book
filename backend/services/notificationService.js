const { sendEmail } = require('./emailService');
const bookingConfirmationTemplate = require('../templates/emails/bookingConfirmation');
const bookingReminderTemplate = require('../templates/emails/bookingReminder');
const bookingCancellationTemplate = require('../templates/emails/bookingCancellation');

function formatBookingDate(date) {
  const d = new Date(date);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
}

async function sendBookingConfirmation(booking, store, service, staff) {
  if (!booking.customerEmail) return;

  const data = {
    storeName: store.name,
    serviceName: service.name,
    staffName: staff.name,
    date: formatBookingDate(booking.date),
    startTime: booking.startTime,
    endTime: booking.endTime,
    customerName: booking.customerName
  };

  await sendEmail({
    to: booking.customerEmail,
    subject: `[${store.name}] 預約確認 - ${data.date} ${booking.startTime}`,
    html: bookingConfirmationTemplate(data)
  });
}

async function sendBookingReminder(booking, store, service, staff) {
  if (!booking.customerEmail) return;

  const data = {
    storeName: store.name,
    serviceName: service.name,
    staffName: staff.name,
    date: formatBookingDate(booking.date),
    startTime: booking.startTime,
    endTime: booking.endTime,
    customerName: booking.customerName
  };

  await sendEmail({
    to: booking.customerEmail,
    subject: `[${store.name}] 預約提醒 - 明天 ${booking.startTime}`,
    html: bookingReminderTemplate(data)
  });
}

async function sendBookingCancellation(booking, store, service, staff) {
  if (!booking.customerEmail) return;

  const data = {
    storeName: store.name,
    serviceName: service.name,
    staffName: staff.name,
    date: formatBookingDate(booking.date),
    startTime: booking.startTime,
    endTime: booking.endTime,
    customerName: booking.customerName
  };

  await sendEmail({
    to: booking.customerEmail,
    subject: `[${store.name}] 預約取消 - ${data.date} ${booking.startTime}`,
    html: bookingCancellationTemplate(data)
  });
}

module.exports = {
  sendBookingConfirmation,
  sendBookingReminder,
  sendBookingCancellation
};
