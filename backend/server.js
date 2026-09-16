require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { WebSocketServer } = require("ws");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("./config/db");
const User = require("./models/User");
const Plan = require("./models/Plan");
const UserSettings = require("./models/UserSettings");
const { setAdminSocket } = require("./utils/ws");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-2026";
const ADMIN_ROLES = ["admin", "superadmin"];

// ─── WebSocket server for realtime chat ───────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ws.userId = decoded.id;
    ws.userRole = decoded.role;
    if (ADMIN_ROLES.includes(decoded.role)) setAdminSocket(decoded.id, ws);
  } catch {
    ws.close(4001, "Unauthorized");
    return;
  }

  ws.on("error", () => {});
  ws.on("close", () => {});
});

const { bus } = require("./utils/ws");
bus.on("chat:message", async (recipientIds, message) => {
  const recipients = new Set((recipientIds || []).map(String));
  const isFromCustomer = !ADMIN_ROLES.includes(message.senderRole);
  const clients = [...wss.clients];
  for (const client of clients) {
    if (client.readyState !== client.OPEN) continue;
    // Every admin sees customer messages (shared inbox)
    if (ADMIN_ROLES.includes(client.userRole) && (isFromCustomer || recipients.has(client.userId))) {
      client.send(JSON.stringify({ type: "message", message }));
      continue;
    }
    // Deliver to the specific customer too (live)
    if (!ADMIN_ROLES.includes(client.userRole) && recipients.has(client.userId)) {
      client.send(JSON.stringify({ type: "message", message }));
    }
  }
});

// Send a periodic ping to keep sockets alive
setInterval(() => {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({ type: "ping", ts: Date.now() }));
    }
  }
}, 25000);

// Middleware
app.set("trust proxy", true);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// On Vercel the Database connects lazily (memoized across invocations).
// Gate requests behind it so the first call after a cold start waits.
const dbReady = process.env.VERCEL
  ? (async () => {
      try {
        const mode = await connectDB();
        await autoSeed();
        console.log(`[server] Database: ${mode}`);
      } catch (err) {
        console.error("[server] DB init failed:", err.message);
        // Never resolve as "ready" if the DB never connected — requests must
        // wait again on the next invocation rather than buffer against a dead
        // mongoose connection.
        throw err;
      }
    })()
  : null;

const requestGate = dbReady
  ? async (req, res, next) => {
      try {
        await connectUntilReady();
        next();
      } catch (err) {
        next(err);
      }
    }
  : null;

if (requestGate) app.use(requestGate);

// Keep the mongoose connection alive: if the pool drops (network blip on Vercel),
// reconnect with the same resilient connectDB before serving the next request.
let dbConnecting = null;
async function connectUntilReady() {
  if (mongoose.connection.readyState === 1) return dbReady;
  if (dbConnecting) return dbConnecting;
  dbConnecting = connectDB()
    .then(async (mode) => {
      await autoSeed();
      return dbReady;
    })
    .finally(() => {
      dbConnecting = null;
    });
  return dbConnecting;
}

// Realtime endpoints must never be cached / revalidated (304s with empty bodies
// make polling clients look "frozen"). Disable ETags so requests always return 200.
app.disable("etag");
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  next();
});

// Serve chat uploads from Cloudflare R2 (falls back to local disk if unconfigured)
app.get("/api/uploads/:key", async (req, res) => {
  try {
    const { getObject } = require("./utils/r2");
    const obj = await getObject(req.params.key);
    if (!obj) return res.status(404).json({ error: "File not found" });
    res.setHeader("Content-Type", obj.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", obj.size);
    obj.stream.pipe(res);
  } catch (err) {
    console.error("[uploads]", err.message);
    return res.status(404).json({ error: "File not found" });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/plans", require("./routes/plans"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/settings", require("./routes/settings"));

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("[error]", err.message);
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large (max 25MB)" });
  }
  return res.status(500).json({ error: "Server error" });
});

// ─── Auto-seed on startup ────────────────────────────────────────────────
async function autoSeed() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
  const ADMIN_PHONE = process.env.ADMIN_PHONE || "9000000000";

  const admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    await User.create({
      name: "Platform Admin",
      username: "admin",
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "superadmin",
      isVerified: true,
      isActive: true,
      businessName: "Platform Admin",
    });
    console.log(`[seed] Super admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else if (admin.role !== "superadmin") {
    admin.role = "superadmin";
    if (!admin.username) admin.username = "admin";
    await admin.save();
    console.log(`[seed] Promoted ${ADMIN_EMAIL} to super admin`);
  }

  const plans = [
    {
      name: "Starter",
      description: "For individuals & freelancers",
      price: 4999,
      billingCycle: "year",
      features: [
        "ITR Filing",
        "Income & Tax Liability Estimation",
        "Capital Gain Guidance",
        "Basic Tax Planning",
        "Tax Saving Guidance",
        "Basic Tax Support",
        "Compliance Reminders",
        "Email Support",
        "Video Call Consultation",
      ],
      popular: false,
      active: true,
    },
    {
      name: "Business",
      description: "For MSMEs & startups",
      price: 14999,
      billingCycle: "year",
      features: [
        "GST Registration & Filing",
        "Income Tax Filing",
        "Basic Accounting",
        "Compliance Calendar",
        "Deadline Reminders",
        "Notice Assistance",
        "24×7 WhatsApp Support",
        "Video Call Consultation",
        "Dedicated Compliance Executive",
      ],
      popular: true,
      active: true,
    },
    {
      name: "Growth",
      description: "For growing businesses",
      price: 24999,
      billingCycle: "year",
      features: [
        "Full GST Compliance",
        "Income Tax",
        "Accounting & Bookkeeping",
        "Monthly Financial Reports",
        "Quarterly Business Review",
        "Tax Saving Guidance",
        "Notice Assistance",
        "Dedicated CA",
        "Priority 24×7 Support",
      ],
      popular: false,
      active: true,
    },
  ];
  for (const plan of plans) {
    await Plan.findOneAndUpdate(
      { name: plan.name },
      { $setOnInsert: plan },
      { upsert: true }
    );
  }
  // Clean up legacy plans (Free/Professional/Enterprise). Scoped to exact legacy
  // names only, so custom plans created later via the admin API are never swept.
  await Plan.deleteMany({ name: { $in: ["Free", "Professional", "Enterprise"] } });
  console.log("[seed] Plans ready");
}

// ─── Start server ────────────────────────────────────────────────────────
async function start() {
  const mode = await connectDB();
  await autoSeed();
  server.listen(PORT, () => {
    console.log(`\n[server] Backend running on http://localhost:${PORT}`);
    console.log(`[server] Database: ${mode}`);
    console.log(`[server] Admin login: ${process.env.ADMIN_EMAIL || "admin@example.com"} / ${process.env.ADMIN_PASSWORD || "Admin@123"}\n`);
  });
}

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

if (process.env.VERCEL) {
  // Vercel (@vercel/node): export the http.Server (Express + WebSocketServer)
  // so Vercel Functions can accept WebSocket upgrades on /ws (Fluid compute)
  // while still serving every REST request through Express. The DB connect is
  // handled by the middleware above, which waits for `dbReady`.
  //
  // IMPORTANT: never export `{ app, start }` (an object) or a bare (req,res)
  // handler here — exporting the server is what enables /ws upgrades.
  module.exports = server;
} else if (require.main === module) {
  start();
  module.exports = { app, start };
}