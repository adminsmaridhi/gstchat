const crypto = require("crypto");
const Otp = require("../models/Otp");

const LINK_TTL_MIN = 15;
const COOLDOWN_SEC = 60;
const MAX_PER_HOUR = 6;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Create a single-use magic link for `email` and persist only its SHA-256.
 * Returns { token, devPath } — devPath lets local/demo clients simulate the email.
 */
async function issueMagicLink({ email, userId }) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + LINK_TTL_MIN * 60 * 1000);

  await Otp.findOneAndDelete({ email: email.toLowerCase(), purpose: "magiclink", used: false });
  await Otp.create({
    email: email.toLowerCase(),
    code: hashToken(token),
    userId: userId || null,
    purpose: "magiclink",
    used: false,
    expiresAt,
  });

  return { token, devPath: `/auth/magic?token=${encodeURIComponent(token)}` };
}

async function cooldownFor(email) {
  const last = await Otp.findOne({ email: email.toLowerCase(), purpose: "magiclink" }).sort({ createdAt: -1 });
  if (!last) return { allow: true, resendIn: 0 };
  const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
  if (elapsed < COOLDOWN_SEC) return { allow: false, resendIn: Math.ceil(COOLDOWN_SEC - elapsed) };

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await Otp.countDocuments({ email: email.toLowerCase(), purpose: "magiclink", createdAt: { $gte: hourAgo } });
  if (recent >= MAX_PER_HOUR) return { allow: false, resendIn: 3600 };
  return { allow: true, resendIn: 0 };
}

/** Validate + consume a magic link. Returns the user id it was issued for. */
async function redeemMagicLink(token) {
  const record = await Otp.findOne({ code: hashToken(token), purpose: "magiclink" });
  if (!record) return { ok: false, error: "This link is invalid. Please request a new one." };
  if (record.used) return { ok: false, error: "This link has already been used." };
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    return { ok: false, error: "This link has expired. Please request a new one." };
  }
  record.used = true;
  await record.save();
  return { ok: true, userId: record.userId, email: record.email };
}

module.exports = { issueMagicLink, redeemMagicLink, cooldownFor, hashToken };