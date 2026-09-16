require("dotenv").config();
const { connectDB, disconnectDB } = require("./config/db");
const User = require("./models/User");
const Plan = require("./models/Plan");
const UserSettings = require("./models/UserSettings");
const bcrypt = require("bcryptjs");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "9000000000";

const DEFAULT_PLANS = [
  {
    name: "Free",
    description: "Get started with basic features",
    price: 0,
    billingCycle: "monthly",
    features: ["1 user", "Basic support", "1 GB storage", "Community access"],
    popular: false,
    active: true,
  },
  {
    name: "Starter",
    description: "Perfect for small businesses",
    price: 499,
    billingCycle: "monthly",
    features: ["Up to 5 users", "Email support", "5 GB storage", "GST reports", "Chat support"],
    popular: false,
    active: true,
  },
  {
    name: "Professional",
    description: "Most popular for growing companies",
    price: 1499,
    billingCycle: "monthly",
    features: [
      "Up to 25 users",
      "Priority support",
      "50 GB storage",
      "GST + TDS reports",
      "File sharing",
      "Custom integrations",
      "API access",
    ],
    popular: true,
    active: true,
  },
  {
    name: "Enterprise",
    description: "For large-scale operations",
    price: 4999,
    billingCycle: "monthly",
    features: [
      "Unlimited users",
      "24/7 dedicated support",
      "Unlimited storage",
      "Advanced GST suite",
      "Custom workflows",
      "White-labeling",
      "SLA guarantee",
      "On-site deployment",
    ],
    popular: false,
    active: true,
  },
];

async function seed() {
  console.log("Connecting to database...");
  await connectDB();

  // Seed admin
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      name: "Platform Admin",
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
      isVerified: true,
      isActive: true,
      businessName: "Platform Admin",
    });
    await UserSettings.create({ userId: admin._id });
    console.log(`[seed] Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`[seed] Admin already exists: ${ADMIN_EMAIL}`);
  }

  // Seed plans
  for (const plan of DEFAULT_PLANS) {
    const existing = await Plan.findOne({ name: plan.name });
    if (!existing) {
      await Plan.create(plan);
      console.log(`[seed] Plan created: ${plan.name} @ ₹${plan.price}`);
    } else {
      console.log(`[seed] Plan already exists: ${plan.name}`);
    }
  }

  console.log("\n[seed] Seeding complete.\n");
  await disconnectDB();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;