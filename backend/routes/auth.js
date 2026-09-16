const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken, requireAuth } = require("../middleware/auth");
const { otpEnabled } = require("../config/config");
const { issueAndDeliverOtp, verifyOtp, rateLimitFor } = require("../utils/otp");
const { gstinIsValid, panIsValid } = require("../utils/validators");

const router = express.Router();

// POST /api/auth/register  (signup with GST + business fields)
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      password,
      gstNumber,
      businessName,
      businessType,
      address,
      city,
      state,
      pincode,
      panNumber,
      companyEmail,
      planId,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "name, email, phone and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (gstNumber !== undefined && gstNumber !== null && gstNumber !== "" && !gstinIsValid(String(gstNumber).trim().toUpperCase())) {
      return res.status(400).json({ error: "Invalid GST number" });
    }
    if (panNumber !== undefined && panNumber !== null && panNumber !== "" && !panIsValid(String(panNumber).trim().toUpperCase())) {
      return res.status(400).json({ error: "Invalid PAN number" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedUsername = username ? String(username).toLowerCase().trim() : null;

    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: String(phone).trim() },
        ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
      ],
    });
    if (existing) {
      return res.status(409).json({ error: "A user with this email, phone or username already exists" });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      phone: String(phone).trim(),
      password: hashed,
      role: "user",
      gstNumber: gstNumber ? String(gstNumber).trim().toUpperCase() : null,
      businessName: businessName || null,
      businessType: businessType || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      panNumber: panNumber ? String(panNumber).trim().toUpperCase() : null,
      companyEmail: companyEmail || null,
      planId: planId || null,
      planActivatedAt: planId ? new Date() : null,
    });

    // Create default settings
    const UserSettings = require("../models/UserSettings");
    await UserSettings.create({ userId: user._id });

    // If OTP is disabled, verify the account immediately
    if (!otpEnabled) {
      user.isVerified = true;
      await user.save();
      const token = signToken(user);
      return res.status(201).json({
        message: "Registration successful.",
        token,
        user: user.toPublic(),
        otpRequired: false,
      });
    }

    // Verification step when the platform requires email confirmation
    if (otpEnabled) {
      const { devPath } = await issueAndDeliverOtp({
        email: user.email,
        name: user.name,
        userId: user._id,
        purpose: "verify",
      });
      return res.status(201).json({
        message: "Registration successful. Please verify your email.",
        userId: user._id,
        email: user.email,
        otpRequired: true,
        authMode: "otp",
        devPath: devPath || null,
      });
    }
  } catch (err) {
    console.error("[register]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/send-otp  (resend / request OTP)
router.post("/send-otp", async (req, res) => {
  try {
    const { email, purpose = "verify" } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });
    if (!/:^| "email"/.test(String(email)) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    const rl = await rateLimitFor({ email, purpose });
    if (!rl.allow) {
      return res.status(429).json({ error: "Too many requests. Please wait before trying again.", resendIn: rl.resendIn });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    const { devPath } = await issueAndDeliverOtp({
      email: String(email).toLowerCase(),
      name: user?.name,
      userId: user ? user._id : null,
      purpose,
    });

    return res.json({ message: "OTP sent", resendIn: 60, devPath: devPath || null });
  } catch (err) {
    console.error("[send-otp]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/verify-otp  (registers + verifies, or verifies existing user)
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "email and code are required" });
    }

    const result = await verifyOtp({ email, code, purpose: "verify" });
    if (!result.ok) {
      const messages = {
        format: "Please enter a valid 6-digit code.",
        missing: "No OTP found. Please request a new one.",
        expired: "OTP has expired. Please request a new one.",
        locked: "Too many incorrect attempts. Please request a new OTP.",
        mismatch: `Invalid OTP. ${result.attemptsLeft ? `${result.attemptsLeft} attempt(s) left.` : ""}`,
      };
      return res.status(400).json({ error: messages[result.reason] || "Invalid OTP." });
    }

    const user = await User.findById(result.user);
    if (!user) return res.status(404).json({ error: "Account not found. Please sign up first." });

    user.isVerified = true;
    user.online = true;
    await user.save();

    const token = signToken(user);
    return res.json({
      message: "Email verified.",
      token,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error("[verify-otp]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/login  (login by email, username or phone)
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Email/username/phone and password are required" });
    }

    const id = identifier.trim();
    const user = await User.findOne({
      $or: [{ email: id.toLowerCase() }, { username: id.toLowerCase() }, { phone: id }],
    });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.isActive) return res.status(403).json({ error: "Account deactivated. Contact admin." });

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // If email not verified AND verification is enabled, issue OTP + return 428
    if (!user.isVerified && otpEnabled) {
      const { devPath } = await issueAndDeliverOtp({
        email: user.email,
        name: user.name,
        userId: user._id,
        purpose: "verify",
      });
      return res.status(428).json({
        error: "Email not verified. A verification OTP was sent.",
        requiresOtp: true,
        authMode: "otp",
        email: user.email,
        userId: user._id,
        devPath: devPath || null,
      });
    }

    // Verification is off — treat any legacy unverified account as verified
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    user.online = true;
    await user.save();

    const token = signToken(user);
    return res.json({ message: "Login successful", token, user: user.toPublic() });
  } catch (err) {
    console.error("[login]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user.toPublic() });
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  req.user.online = false;
  await req.user.save();
  return res.json({ message: "Logged out" });
});

module.exports = router;