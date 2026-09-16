const express = require("express");
const UserSettings = require("../models/UserSettings");
const { requireAuth } = require("../middleware/auth");
const { gstinIsValid, panIsValid } = require("../utils/validators");

const router = express.Router();

// GET /api/settings -> current user settings
router.get("/", requireAuth, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.userId });
    if (!settings) {
      settings = await UserSettings.create({ userId: req.userId });
    }
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// PATCH /api/settings -> update customization
router.patch("/", requireAuth, async (req, res) => {
  try {
    const allowed = [
      "themeColor",
      "sidebarCollapsed",
      "notificationsEnabled",
      "emailNotifications",
      "language",
      "timezone",
      "customTitle",
      "profileVisibility",
      "twoFactorEnabled",
    ];
    const body = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) body[key] = req.body[key];
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.userId },
      { $set: body },
      { new: true, upsert: true }
    );
    return res.json({ settings });
  } catch (err) {
    console.error("[settings]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// PATCH /api/settings/profile -> update profile fields (including GST)
router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const allowed = [
      "name",
      "phone",
      "gstNumber",
      "businessName",
      "businessType",
      "address",
      "city",
      "state",
      "pincode",
      "panNumber",
      "companyEmail",
      "avatar",
    ];
    const body = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) body[key] = req.body[key];
    }
    if (body.gstNumber !== undefined && body.gstNumber !== null && body.gstNumber !== "") {
      body.gstNumber = String(body.gstNumber).trim().toUpperCase();
      if (!gstinIsValid(body.gstNumber)) {
        return res.status(400).json({ error: "Invalid GST number" });
      }
    } else if (body.gstNumber === "") {
      body.gstNumber = null;
    }
    if (body.panNumber !== undefined && body.panNumber !== null && body.panNumber !== "") {
      body.panNumber = String(body.panNumber).trim().toUpperCase();
      if (!panIsValid(body.panNumber)) {
        return res.status(400).json({ error: "Invalid PAN number" });
      }
    } else if (body.panNumber === "") {
      body.panNumber = null;
    }
    Object.assign(req.user, body);
    await req.user.save();
    return res.json({ user: req.user.toPublic() });
  } catch (err) {
    console.error("[profile]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;