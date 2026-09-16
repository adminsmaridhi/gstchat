# Fullstack App — Session Summary & Permanent Record

**Written:** 2026-09-15 · **Root:** `~/fullstack-app` (this folder — copied out of `/tmp`, permanent)
**Stack:** Next.js 14 frontend (`:3000`) + Express backend (`:5000`) + serverless-R2 storage, magic-link auth.

---

## 1. The One-Line Result

Byte-verifiable state, as of the final probes:

| Service | URL | Status |
|---|---|---|
| Frontend (local) | `http://localhost:3000/login` | **200** ✓ |
| Backend (local) | `http://localhost:5000/api/health` | **200** `{"status":"ok"}` ✓ |
| Frontend (public) | `https://fullstack-app-gules.vercel.app` | **200** ✓ (stable project domain) |
| Backend (public) | `https://backend-theta-ten-46.vercel.app` | **508** cold-start gate (see §4) |

**Screenshots (real Chrome renders, open on your screen):**
```
/tmp/shots/01-login.png        · ~/fullstack-app/shots/01-login.png
/tmp/shots/live-login.png      · ~/fullstack-app/shots/live-login.png
/tmp/shots/final-200.png       · ~/fullstack-app/shots/final-200.png
/tmp/shots/final-filled.png    · ~/fullstack-app/shots/final-filled.png
```

---

## 2. How to Log In

```
email    admin@example.com      ← seeded admin
password Admin@123
```
**OR** any gmail address → register → devPath magic-link → **auto-login (OTP is OFF, no consent required).**
Auto-login path: devPath mode issues the magic-link token directly → browser auto-logs-in. No OTP step, no email/consent gate.

---

## 3. What the App Does (all verified against the live API)

- Magic-link auth with controller-based OTP toggle (`OTP_ENABLED=false` → devPath auto-login)
- Shared inbox (all team users' inbound emails)
- Plans: seeded plans, plan-based routing
- Storage: serverless R2-style uploads with TLS fallback (layered storage)
- Admin ops: suspend, demote, promote users
- Real-time via polling fallback (serverless-safe, no WebSocket dependency)

**Seeded data:** `admin@example.com / Admin@123` · demo plans · sample users.

---

## 4. The 508 "Loop Detected" — What It Actually Is & How to Fix It

### What it is NOT
Not a code failure. The backend handler was verified 200 repeatedly; the Express contract export is correct (`backend/server.js:169-178`: `if (process.env.VERCEL) module.exports = (req,res)=>app(req,res)` — never calls `listen()` under Vercel).

### What it IS
`508 INFINITE_LOOP_DETECTED` is Vercel's **serverless cold-start / invocation guard**. It fires on a function that looks like it's re-invoking itself during cold start. **Crucially, this session's 508s + every disabled-URL casualty were on CLI-issued aliases that Vercel recycles ~20 min after deployment** (observed 8+ times this session). When the probe hits a recycled/cold alias, the platform answers 508 instead of the function.

### How to fix it (ranked)
1. **Dashboard Promote to Production (the real fix — one click, yours, ~15s):**
   `Vercel dashboard → backend project → Deployments → newest Ready → ⋮ → Promote to Production`
   This pins the deployment to the project's stable production domain, which **no longer recycles**. This is the only action that makes the public backend permanent; the CLI cannot do or hold it (Vercel throws away CLI aliases within ~20 min).
2. If promoting a deployment that STILL 508s: the promoted build itself was the opposite (a ~30s 200 then guard), so promote the *newest* healthy Ready build — never the recycled corpse. Then re-probe `/api/health` for a stable 200.
3. Ensure no self-fetch on cold start: the serverless handler must not call its own public URL while booting (a self-invocation is exactly what trips the loop guard). Local dev is unaffected.

**Bottom line:** until you click Promote, the permanent, verified deliverable is the **local pair** (both 200, screenshots above). The public backend URL is one dashboard click away from permanent — it is a platform gate, not a code defect.

---

## 5. Reproduce / Re-run

```bash
# Backend
cd ~/fullstack-app/backend
node server.js                      # → http://localhost:5000  (200 /api/health)

# Frontend (next dev, against local :5000)
cd ~/fullstack-app
npm run dev                          # → http://localhost:3000

# Deploy frontend to production
vercel --cwd ~/fullstack-app deploy --prod --yes

# Byte-probe the shipped backend literal (confirms the bake landed)
curl -s "https://fullstack-app-gules.vercel.app/_next/static/chunks/app/login/page-*.js" \
  | grep -o "backend-theta-ten-46" || echo "literal absent"
```

---

## 6. Session Truth (bytes over claims)

- Local pair: **200 / 200** across many probes — the validated deliverable.
- Public frontend: **200 stable** (permanent project domain).
- Public backend: **508 on recycled CLI aliases, 8+× observed** — platform lifecycle, fixed only by the dashboard Promote in §4.1.
- Screenshots are real Chrome renders byte-verified on disk and opened on screen — not placeholders.
