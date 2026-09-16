const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { signToken, requireAuth } = require("../middleware/auth");
const { generateOtp } = require("../utils/otp");
const { otpEnabled, authMode, mailProvider } = require("../config/config");
const { issueMagicLink, redeemMagicLink, cooldownFor } = require("../utils/magic-link");

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
      gstNumber: gstNumber || null,
      businessName: businessName || null,
      businessType: businessType || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      panNumber: panNumber || null,
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
      if (authMode === "magiclink") {
        const { token, devPath } = await issueMagicLink({ email: user.email, userId: user._id });
        console.log(`\n[MAGIC LINK] Verify email: ${process.env.BASE_URL || "http://localhost:3000"}${devPath}\n`);
        return res.status(201).json({
          message: "Registration successful. Click the link in your email to verify.",
          userId: user._id,
          email: user.email,
          otpRequired: true,
          authMode: "magiclink",
          devPath: mailProvider ? null : devPath,
        });
      }
      // Fallback: 6-digit OTP
      const code = generateOtp();
      await Otp.create({
        email: user.email,
        code,
        userId: user._id,
        purpose: "verify",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      console.log(`\n[OTP] Email verification code for ${user.email}: ${code}\n`);
      return res.status(201).json({
        message: "Registration successful. Please verify your email.",
        userId: user._id,
        email: user.email,
        otpRequired: true,
        authMode: "otp",
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

    const record = await Otp.findOneAndDelete({ email: email.toLowerCase(), used: false });
    const user = await User.findOne({ email: email.toLowerCase() });

    const code = generateOtp();
    await Otp.create({
      email: email.toLowerCase(),
      code,
      userId: user ? user._id : null,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    console.log(`\n[OTP] ${purpose} code for ${email}: ${code}\n`);

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("[send-otp]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/verify-otp  (registers + verifies, or verifies existing user)
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code, userId } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "email and code are required" });
    }

    const otp = await Otp.findOne({ email: email.toLowerCase(), used: false }).sort({ createdAt: -1 });
    if (!otp) {
      return res.status(400).json({ error: "No OTP found. Please request a new one." });
    }
    if (otp.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }
    if (otp.code !== String(code).trim()) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    otp.used = true;
    await otp.save();

    const user = await User.findById(otp.userId);
    if (user) {
      user.isVerified = true;
      await user.save();
      const token = signToken(user);
      return res.json({
        message: "Email verified.",
        token,
        user: user.toPublic(),
      });
    }

    return res.status(404).json({ error: "Account not found. Please sign up first." });
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

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Account deactivated. Contact admin." });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // If email not verified AND verification is enabled, require it
    if (!user.isVerified && otpEnabled) {
      if (authMode === "magiclink") {
        return res.status(428).json({
          error: "Email not verified. A sign-in link will be sent.",
          requiresOtp: true,
          authMode: "magiclink",
          email: user.email,
          userId: user._id,
        });
      }
      const code = generateOtp();
      await Otp.create({
        email: user.email,
        code,
        userId: user._id,
        purpose: "verify",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
      console.log(`\n[OTP] Verify-before-login code for ${user.email}: ${code}\n`);
      return res.status(428).json({
        error: "Email not verified. OTP sent.",
        requiresOtp: true,
        authMode: "otp",
        email: user.email,
        userId: user._id,
      });
    }

    // If verification is disabled, treat any legacy unverified account as verified
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    user.online = true;
    await user.save();

    const token = signToken(user);
    return res.json({
      message: "Login successful",
      token,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error("[login]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/magic-link  (request a sign-in / verification link)
router.post("/magic-link", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "email is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    const { allow, resendIn } = await cooldownFor(email);
    if (!allow) {
      return res.status(429).json({ error: "Too many requests", resendIn });
    }

    const user = await User.findOne({ email });
    const { token, devPath } = await issueMagicLink({ email, userId: user ? user._id : null });

    console.log(`\n[MAGIC LINK] Sign in: ${process.env.BASE_URL || "http://localhost:3000"}${devPath}\n`);
    return res.json({
      message: user
        ? "Check your email — a sign-in link was sent."
        : "If that email is registered, we sent a sign-in link.",
      email,
      devPath: mailProvider ? null : devPath,
      resendIn: 60,
      accountExists: !!user,
    });
  } catch (err) {
    console.error("[magic-link]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/magic-link/verify  (consume the link token -> session)
router.post("/magic-link/verify", async (req, res) => {
  try {
    const token = String(req.body.token || "").trim();
    if (!token) return res.status(400).json({ error: "token is required" });

    const result = await redeemMagicLink(token);
    if (!result.ok) return res.status(400).json({ error: result.error });

    const user = await User.findById(result.userId);
    if (!user) return res.status(404).json({ error: "Account not found. Please sign up first." });
    if (!user.isActive) return res.status(403).json({ error: "Account deactivated. Contact admin." });

    user.isVerified = true;
    user.online = true;
    await user.save();

    const jwt = signToken(user);
    return res.json({
      message: "Signed in via magic link.",
      token: jwt,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error("[magic-link verify]", err.message);
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