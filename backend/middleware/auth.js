const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-2026";

const ADMIN_ROLES = ["admin", "superadmin"];

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Account deactivated" });
    }
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && isAdminRole(req.user.role)) {
    return next();
  }
  return res.status(403).json({ error: "Admin access required" });
}

function requireSuperAdmin(req, res, next) {
  if (req.user && req.user.role === "superadmin") {
    return next();
  }
  return res.status(403).json({ error: "Super admin access required" });
}

module.exports = { signToken, requireAuth, requireAdmin, requireSuperAdmin, isAdminRole, JWT_SECRET };