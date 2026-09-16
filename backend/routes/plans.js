const express = require("express");
const Plan = require("../models/Plan");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/plans  (public - active plans)
router.get("/", async (req, res) => {
  try {
    const filter = req.query.all === "1" ? {} : { active: true };
    const plans = await Plan.find(filter).sort({ price: 1 });
    return res.json({ plans });
  } catch (err) {
    console.error("[plans GET]", err.message, err.stack || "");
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/plans  (admin - create)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, billingCycle, features, popular, active } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: "name and price are required" });
    }
    const plan = await Plan.create({
      name,
      description: description || "",
      price: Number(price),
      billingCycle: billingCycle || "monthly",
      features: Array.isArray(features) ? features : [],
      popular: !!popular,
      active: active !== false,
    });
    return res.status(201).json({ plan });
  } catch (err) {
    console.error("[create plan]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// PUT /api/plans/:id  (admin - update)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    return res.json({ plan });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE /api/plans/:id  (admin - soft delete)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    plan.active = false;
    plan.popular = false;
    await plan.save();
    return res.json({ message: "Plan deactivated" });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/plans/:id/subscribe  (user - subscribe)
router.post("/:id/subscribe", requireAuth, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan || !plan.active) return res.status(404).json({ error: "Plan not found" });

    const months =
      plan.billingCycle === "year" || plan.billingCycle === "yearly"
        ? 12
        : plan.billingCycle === "quarterly"
        ? 3
        : plan.billingCycle === "one-time"
        ? 0
        : 1;

    const now = new Date();
    const expiresAt = months > 0 ? new Date(now.setMonth(now.getMonth() + months)) : null;

    req.user.planId = plan._id;
    req.user.planActivatedAt = new Date();
    req.user.planExpiresAt = expiresAt;
    await req.user.save();

    return res.json({ message: `Subscribed to ${plan.name}`, plan });
  } catch (err) {
    console.error("[subscribe]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;