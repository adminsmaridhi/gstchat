export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

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