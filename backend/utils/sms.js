const { FAST2SMS_API_KEY, FAST2SMS_SENDER_ID } = process.env;

/**
 * Send an OTP via Fast2SMS (India). Uses the dedicated "otp" route so the
 * provider manages expiry/verification on their side when paired with their
 * verify endpoint; the code is also always logged locally for demos.
 *
 * Falls back to console-only logging when FAST2SMS_API_KEY is not configured,
 * mirroring the email mailer behavior.
 *
 * Resolves { sent, mode, details }.
 */
async function sendOtpSms({ phone, code, purpose = "verify" }) {
  const numbers = String(phone || "")
    .replace(/[^0-9]/g, "")
    .replace(/^91/, "")
    .replace(/^0/, "");
  if (!numbers) {
    console.log(`\n[OTP][SMS] No valid phone for ${phone || "(missing)"}\n`);
    return { sent: false, mode: "no-phone" };
  }

  console.log(`\n[OTP][SMS] Delivery mode: ${FAST2SMS_API_KEY ? "fast2sms" : "console (no FAST2SMS_API_KEY)"}`);
  console.log(`[OTP][SMS] To: +91${numbers} | ${purpose} code: ${code}\n`);

  if (!FAST2SMS_API_KEY) {
    return { sent: false, mode: "console", phone: numbers, code };
  }

  try {
    const body = new URLSearchParams({
      route: "otp",
      variables_values: String(code),
      numbers,
    });
    if (FAST2SMS_SENDER_ID) body.set("sender_id", FAST2SMS_SENDER_ID);

    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: FAST2SMS_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "cache-control": "no-cache",
      },
      body: body.toString(),
    });
    const data = await res.json();
    if (res.ok && data.return === true) {
      return { sent: true, mode: "fast2sms", details: data.message };
    }
    console.error("[fast2sms]", JSON.stringify(data));
    return { sent: false, mode: "fast2sms", error: data };
  } catch (err) {
    console.error("[fast2sms]", err.message);
    return { sent: false, mode: "fast2sms", error: err.message };
  }
}

module.exports = { sendOtpSms };