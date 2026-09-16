const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  SMTP_SECURE = "false",
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
} = process.env;

// Tier 1 — Gmail API OAuth2 (no password stored; refresh token in .env).
let gmail = null;
if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
  const oauth = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  oauth.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  gmail = google.gmail({ version: "v1", auth: oauth });
  console.log("[mailer] Gmail API enabled (OAuth2 refresh token). Real links will be delivered via premiuma754@gmail.com.");
}

// Tier 2 — classic SMTP.
const configured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (configured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: String(SMTP_SECURE).toLowerCase() === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Send an email. Falls back to logging to the console when SMTP is not set up.
 * Resolves { sent, mode, info }.
 */
async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log(`\n===== EMAIL (console mode) =====\nTo: ${to}\nSubject: ${subject}\n${html || text}\n================================\n`);
    return { sent: false, mode: "console" };
  }
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      html: html || text,
      text: text || html,
    });
    return { sent: true, mode: "smtp", messageId: info.messageId };
  } catch (err) {
    console.error("[mailer]", err.message);
    console.log(`\n===== EMAIL (send failed -> console) =====\nTo: ${to}\nSubject: ${subject}\n${html || text}\n============================================\n`);
    return { sent: false, mode: "console", error: err.message };
  }
}

module.exports = { sendMail, configured };