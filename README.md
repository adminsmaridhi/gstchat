# SaaSify — Full-Stack Business Platform (React + Node.js + MongoDB)

An all-in-one SaaS web app with:

- **Sign up / Login** with email-OTP verification
- **GST + business fields** collected at signup (GST number, business name/type, address, PAN, etc.)
- **Pricing plans** (Free / Starter / Professional / Enterprise) with subscribe + admin CRUD
- **Dashboard** showing profile, GST details, plan status, and activity
- **Chat** between users and admins — realtime (WebSocket for admin), file uploads (images, PDFs, docs up to 25MB)
- **Admin panel** — user management, stats, plan breakdown, promote/suspend users
- **Customization** — theme color, app title, language, timezone, notifications, privacy

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | Next.js 14 (React) + Tailwind CSS |
| Backend  | Node.js + Express + Mongoose |
| Database | MongoDB (auto in-memory fallback — **no MongoDB install required**) |
| Auth     | JWT + bcrypt + OTP |

## Running the app

### Option A — One command (both servers)

```bash
./run.sh
```

### Option B — Two terminals

```bash
# Terminal 1 — backend  (http://localhost:5000)
cd backend && npm install && npm start

# Terminal 2 — frontend (http://localhost:3000)
npm install && npm run dev
```

Open **http://localhost:3000**.

> If you have a real MongoDB instance, set `MONGODB_URI` in `backend/.env`.
> Otherwise the backend automatically boots an in-memory MongoDB (data resets on restart).

## Default admin (auto-seeded on backend start)

```
Email:    admin@example.com
Password: Admin@123
```

## OTP / email note

OTP emails are delivered via **Resend** (transactional email API). Set
`RESEND_API_KEY` and `RESEND_FROM` in `backend/.env` (or Vercel env vars).
Requires a verified domain in Resend to send to arbitrary recipients; without
it, delivery falls back to the Resend sandbox. Without any mail config, OTP
codes are printed to the backend terminal.

## Project structure

```
├── run.sh                     # start both servers with one command
├── src/                       # Next.js frontend
│   ├── app/
│   │   ├── page.tsx           # landing page
│   │   ├── login/ signup/     # auth pages (signup includes GST fields)
│   │   ├── verify/            # OTP entry page
│   │   └── dashboard/         # user dashboard, plans, chat, settings, admin
│   ├── components/            # AuthContext, DashboardShell
│   └── lib/api.ts             # fetch wrapper + token/user helpers
└── backend/                   # Express + Mongoose API
    ├── server.js              # entry + WebSocket (realtime chat)
    ├── config/db.js           # Mongo connect w/ in-memory fallback
    ├── models/                # User, Otp, Plan, ChatMessage, UserSettings
    ├── middleware/            # auth (JWT), upload (multer)
    └── routes/                # auth, plans, chat, admin, settings
```

## API overview (base `http://localhost:5000/api`)

- `POST /auth/register` — signup with GST/business fields → creates OTP
- `POST /auth/send-otp` — send/resend OTP
- `POST /auth/verify-otp` — verify OTP → marks verified, returns JWT
- `POST /auth/login` — login (returns 428 if email not verified)
- `GET  /auth/me` · `POST /auth/logout`
- `GET/POST /plans` · `PUT/DELETE /plans/:id` (admin) · `POST /plans/:id/subscribe`
- `GET/POST /chat` (multipart file upload) · `DELETE /chat/:id` · `WS /ws` (realtime)
- `GET/PATCH /settings` · `PATCH /settings/profile`
- `GET /admin/stats` · `GET /admin/users` · `PATCH /admin/users/:id`