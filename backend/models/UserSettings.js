const mongoose = require("mongoose");
const noNull = require("../utils/no-null");

const userSettingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    themeColor: { type: String, default: "#4F46E5" },
    sidebarCollapsed: { type: Boolean, default: false },
    notificationsEnabled: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "Asia/Kolkata" },
    customTitle: { type: String },
    profileVisibility: { type: String, enum: ["public", "private"], default: "public" },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

noNull(userSettingsSchema);

module.exports = mongoose.model("UserSettings", userSettingsSchema);