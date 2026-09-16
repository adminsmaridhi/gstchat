const mongoose = require("mongoose");
const noNull = require("../utils/no-null");

userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },

    // Business / GST details collected at signup
    gstNumber: { type: String },
    businessName: { type: String },
    businessType: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    panNumber: { type: String },
    companyEmail: { type: String },

    // Plan membership
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
    planActivatedAt: { type: Date },
    planExpiresAt: { type: Date },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    avatar: { type: String },
    online: { type: Boolean, default: false },
  },
  { timestamps: true }
);

noNull(userSchema);

// Normalize phone for login matching
userSchema.index({ username: 1, email: 1, phone: 1 });
// Admin listing: role-filtered, most-recent-first
userSchema.index({ role: 1, createdAt: -1 });
// Customer listings / presence
userSchema.index({ role: 1, online: 1 });
// Active-user counts
userSchema.index({ isActive: 1 });
// Admin listing sorted by creation
userSchema.index({ createdAt: -1 });

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    phone: this.phone,
    role: this.role,
    gstNumber: this.gstNumber,
    businessName: this.businessName,
    businessType: this.businessType,
    address: this.address,
    city: this.city,
    state: this.state,
    pincode: this.pincode,
    panNumber: this.panNumber,
    companyEmail: this.companyEmail,
    planId: this.planId,
    planActivatedAt: this.planActivatedAt,
    planExpiresAt: this.planExpiresAt,
    isVerified: this.isVerified,
    isActive: this.isActive,
    avatar: this.avatar,
    online: this.online,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);