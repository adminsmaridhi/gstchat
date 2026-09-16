// Central app config (values can come from environment variables)
const config = {
  // When false, email verification is skipped entirely:
  //  - new users are auto-verified at registration
  //  - login works immediately (no verification screen)
  otpEnabled: String(process.env.OTP_ENABLED || "false").toLowerCase() === "true",
  // Verification method used when otpEnabled=true: "magiclink" | "otp"
  authMode: (process.env.AUTH_MODE || "magiclink").toLowerCase(),
  // Where verification emails would be sent. If null, links/codes print to
  // the backend terminal and the dev path is returned inline (for demos).
  mailProvider: process.env.MAIL_PROVIDER || null,
};

module.exports = config;