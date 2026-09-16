const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    billingCycle: { type: String, enum: ["monthly", "quarterly", "yearly", "one-time"], default: "monthly" },
    features: { type: [String], default: [] },
    popular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Public pricing page: active plans ordered by price
planSchema.index({ active: 1, price: 1 });
// Popular / featured plan queries
planSchema.index({ popular: 1, active: 1 });

module.exports = mongoose.model("Plan", planSchema);