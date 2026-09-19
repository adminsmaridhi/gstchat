export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const PHONE_RE = /^[6-9][0-9]{9}$/;
export const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const NAME_RE = /^[a-zA-Z][a-zA-Z&'.\- ]{1,59}$/;
export const PINCODE_RE = /^[0-9]{6}$/;

const VALID_GST_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function gstinIsValid(gstin: string) {
  const value = String(gstin || "").trim().toUpperCase();
  if (!GSTIN_RE.test(value)) return false;
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = VALID_GST_CHARSET.indexOf(value[i]) * weights[i];
    sum += Math.floor(product / 36) + (product % 36);
  }
  const check = (36 - (sum % 36)) % 36;
  return VALID_GST_CHARSET[check] === value[14];
}

export function panIsValid(pan: string) {
  return PAN_RE.test(String(pan || "").trim().toUpperCase());
}

export function phoneIsValid(phone: string) {
  const value = String(phone || "").trim().replace(/^(?:\+?91|0)/, "");
  return PHONE_RE.test(value);
}

export function normalizeUsername(username: string) {
  return String(username || "").trim().toLowerCase();
}

export function usernameIsValid(username: string) {
  return USERNAME_RE.test(String(username || "").trim().toLowerCase());
}

export function nameIsValid(name: string) {
  return NAME_RE.test(String(name || "").trim().replace(/\s+/g, " "));
}

export function pincodeIsValid(pincode: string) {
  return PINCODE_RE.test(String(pincode || "").trim());
}