const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PHONE_RE = /^[6-9][0-9]{9}$/;
const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[a-zA-Z][a-zA-Z&'.\- ]{1,59}$/;
const PINCODE_RE = /^[0-9]{6}$/;

const VALID_GST_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// GSTIN last digit is a base-36 checksum over the first 14 chars.
// For each char: P = code * multiplier (1,2 alternating). Its hash is the
// digit sum in base 36 (quotient + remainder of P ÷ 36). Sum all hashes,
// then check = (36 - (sum mod 36)) mod 36 (0-9 then A-Z).
function gstinIsValid(gstin) {
  const value = String(gstin || "").trim().toUpperCase();
  if (!value || !GSTIN_RE.test(value)) return false;
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = VALID_GST_CHARSET.indexOf(value[i]) * weights[i];
    sum += Math.floor(product / 36) + (product % 36);
  }
  const check = (36 - (sum % 36)) % 36;
  return VALID_GST_CHARSET[check] === value[14];
}

function panIsValid(pan) {
  const value = String(pan || "").trim().toUpperCase();
  return Boolean(value && PAN_RE.test(value));
}

// Indian mobile: 10 digits, starting 6–9. Optionally strips a leading +91 / 91.
function phoneIsValid(phone) {
  const value = String(phone || "").trim().replace(/^(?:\+?91|0)/, "");
  return Boolean(value && PHONE_RE.test(value));
}

function normalizePhone(phone) {
  const value = String(phone || "").trim().replace(/^(?:\+?91|0)/, "");
  return value;
}

// Lowercase, alphanumeric + underscore username (3–20 chars, starts with a letter).
function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function usernameIsValid(username) {
  return USERNAME_RE.test(String(username || "").trim().toLowerCase());
}

// Standard email format (full addresses only).
function emailIsValid(email) {
  return EMAIL_RE.test(String(email || "").trim());
}

// Human name: starts with a letter, letters/numbers/&.'- and spaces, 2–60 chars.
function nameIsValid(name) {
  return NAME_RE.test(String(name || "").trim().replace(/\s+/g, " "));
}

// Indian PIN code: 6 digits.
function pincodeIsValid(pincode) {
  return PINCODE_RE.test(String(pincode || "").trim());
}

module.exports = {
  gstinIsValid,
  panIsValid,
  phoneIsValid,
  normalizePhone,
  normalizeUsername,
  usernameIsValid,
  emailIsValid,
  nameIsValid,
  pincodeIsValid,
};