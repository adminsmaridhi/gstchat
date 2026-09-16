/**
 * ensure-indexes.js — applies & reports indexes across all collections.
 * Run: node scripts/ensure-indexes.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Otp = require("../models/Otp");
const Plan = require("../models/Plan");
const ChatMessage = require("../models/ChatMessage");
const UserSettings = require("../models/UserSettings");

(async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gstchat";
  await mongoose.connect(uri, { dbName: process.env.DB_NAME || "gstchat" });
  console.log("Connected to", mongoose.connection.host);

  const models = [
    { name: "users", model: User },
    { name: "otps", model: Otp },
    { name: "plans", model: Plan },
    { name: "chatmessages", model: ChatMessage },
    { name: "usersettings", model: UserSettings },
  ];

  for (const { name, model } of models) {
    await model.init(); // builds schema indexes (autoIndex)
    await model.syncIndexes(); // creates missing, drops obsolete ones
    const cols = await mongoose.connection.db.collection(name).indexes();
    console.log(`\n[${name}] ${cols.length} indexes`);
    for (const c of cols) console.log("  -", JSON.stringify(c.key), c.unique ? "(unique)" : "", c.expireAfterSeconds ? `(TTL ${c.expireAfterSeconds}s)` : "");
  }

  await mongoose.disconnect();
  console.log("\nDone.");
})().catch((e) => { console.error(e); process.exit(1); });