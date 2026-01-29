const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('[Email] SMTP 未設定，跳過寄送:', subject);
    return null;
  }

  try {
    const result = await transport.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html
    });
    console.log('[Email] 寄送成功:', to, subject);
    return result;
  } catch (error) {
    console.error('[Email] 寄送失敗:', error.message);
    return null;
  }
}

module.exports = { sendEmail };
