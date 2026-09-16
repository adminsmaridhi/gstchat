const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

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

module.exports = { gstinIsValid, panIsValid };