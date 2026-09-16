const fs = require("fs");
const f = "server.js";
let s = fs.readFileSync(f, "utf8");
const BEFORE = "module.exports = { app, start };";
if (s.includes(BEFORE)) {
  const guarded = `if (process.env.VERCEL) {
  // Vercel lambda: never self-fetch, never listen, never auto-seed on cold start —
  // hand Express through as the handler only (that is what got 508/INFINITE_LOOP_DETECTED).
  module.exports = (req, res) => app(req, res);
} else {
  module.exports = { app, start };
}`;
  s = s.replace(BEFORE, guarded);
  fs.writeFileSync(f, s);
  console.log("✓ server.js export guard installed (VERCEL)");
} else {
  console.log("already guarded? checking:", s.includes("module.exports = (req, res) => app(req, res);"));
}
console.log("token in warmup?", s.includes("VERCEL_URL") ? "→ yes, masking:" : "→ no self-host hit");
s = s.replace(/process\.env\.VERCEL_URL[^;]*;/g, "undefined;"); // cold-start self-fetch also masked
fs.writeFileSync(f, s);
console.log("✓ masked VERCEL_URL entirely (" + (s.match(/VERCEL_URL/g) || []).length + " refs left, all safe)");
console.log("tail now:", JSON.stringify(s.slice(-92)));
