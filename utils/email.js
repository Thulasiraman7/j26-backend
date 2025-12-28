// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,           // e.g. smtp.gmail.com
  port: Number(process.env.SMTP_PORT),   // 465 or 587
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,         // your email address
    pass: process.env.SMTP_PASS          // your app password
  }
});

async function sendVerificationEmail(to, link) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || 'J26ChatFree';

  const html = `
    <div style="font-family:system-ui">
      <h2>${appName} – Verify your email</h2>
      <p>Click the button below to verify your email and start chatting.</p>
      <p><a href="${link}" style="background:#3b82f6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Verify Email</a></p>
      <p>If the button doesn't work, copy and paste this link:</p>
      <p>${link}</p>
    </div>
  `;

  return transporter.sendMail({
    from,
    to,
    subject: `${appName} – Email Verification`,
    html
  });
}

module.exports = { sendVerificationEmail };

