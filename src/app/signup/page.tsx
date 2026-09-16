"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, formatINR } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";
import { gstinIsValid, panIsValid } from "@/lib/validators";

const BUSINESS_TYPES = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "Public Limited",
  "Sole Trader",
  "Other",
];

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading sign up...</div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [planId, setPlanId] = useState(params.get("plan") || "");
  const [infoPlan, setInfoPlan] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    gstNumber: "",
    businessName: "",
    businessType: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    panNumber: "",
    companyEmail: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<any>("/plans")
      .then((d) => {
        setPlans(d.plans);
        const preselected = params.get("plan");
        if (preselected) {
          const valid = d.plans.find((p: any) => p._id === preselected);
          if (valid) setPlanId(valid._id);
        }
        // Default: no plan selected — user can choose one or proceed with Free
      })
      .catch(() => {});
  }, []);

  const set = (k: string) => (e: any) => {
    const raw = e.target.value;
    const v = ["gstNumber", "panNumber"].includes(k) ? raw.toUpperCase() : raw;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const gst = form.gstNumber.trim().toUpperCase();
    const pan = form.panNumber.trim().toUpperCase();
    if (gst && !gstinIsValid(gst)) {
      setError("That GST number doesn't look valid. Enter a 15-character GSTIN (e.g. 22AAAAA0000A1Z5).");
      return;
    }
    if (pan && !panIsValid(pan)) {
      setError("That PAN number doesn't look valid. Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).");
      return;
    }
    setLoading(true);
    try {
      const data = await api<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...form, gstNumber: gst, panNumber: pan, planId: planId || null }),
      });
      // If OTP is disabled, the API returns a token and logs you straight in
      if (data.token && data.user) {
        login(data.token, data.user);
        router.push("/dashboard/chat");
        return;
      }
      router.push(`/verify?email=${encodeURIComponent(data.email)}&userId=${data.userId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const input = "input";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-slate-500">
            Fill in your details including GST number & business info. We&apos;ll send an OTP to verify your email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Account Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full Name *</label>
                <input className={input} placeholder="Rahul Sharma" value={form.name} onChange={set("name")} required />
              </div>
              <div>
                <label className="label">Username *</label>
                <input className={input} placeholder="e.g. rahul" value={form.username} onChange={set("username")} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className={input} placeholder="you@company.com" value={form.email} onChange={set("email")} required />
              </div>
              <div>
                <label className="label">Mobile Number *</label>
                <input className={input} placeholder="9876543210" value={form.phone} onChange={set("phone")} required />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className={input} placeholder="Min 6 characters" value={form.password} onChange={set("password")} required minLength={6} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Business & GST Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">GST Number</label>
                <input className={input} placeholder="22AAAAA0000A1ZC" value={form.gstNumber} onChange={set("gstNumber")} maxLength={15} style={{ textTransform: "uppercase" }} />
                {form.gstNumber && !gstinIsValid(form.gstNumber) && (
                  <p className="mt-1 text-xs text-red-600">Invalid GST number</p>
                )}
              </div>
              <div>
                <label className="label">Business Name</label>
                <input className={input} placeholder="Sharma Traders Pvt Ltd" value={form.businessName} onChange={set("businessName")} />
              </div>
              <div>
                <label className="label">Business Type</label>
                <select className={input} value={form.businessType} onChange={set("businessType")}>
                  <option value="">Select type</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">PAN Number</label>
                <input className={input} placeholder="ABCDE1234F" value={form.panNumber} onChange={set("panNumber")} maxLength={10} style={{ textTransform: "uppercase" }} />
                {form.panNumber && !panIsValid(form.panNumber) && (
                  <p className="mt-1 text-xs text-red-600">Invalid PAN number</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Registered Address</label>
                <input className={input} placeholder="Shop No. 12, Main Market, MG Road" value={form.address} onChange={set("address")} />
              </div>
              <div>
                <label className="label">City</label>
                <input className={input} placeholder="Mumbai" value={form.city} onChange={set("city")} />
              </div>
              <div>
                <label className="label">State</label>
                <input className={input} placeholder="Maharashtra" value={form.state} onChange={set("state")} />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className={input} placeholder="400001" value={form.pincode} onChange={set("pincode")} />
              </div>
              <div>
                <label className="label">Company Email</label>
                <input type="email" className={input} placeholder="billing@company.com" value={form.companyEmail} onChange={set("companyEmail")} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Choose a Plan
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setPlanId("")}
                className={`rounded-xl border-2 border-dashed p-3 text-left transition ${
                  !planId
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-sm">No Plan</div>
                <div className="mt-1 text-base font-bold text-slate-900">
                  Free
                  <span className="text-xs font-normal text-slate-500">/ for now</span>
                </div>
                <div className="mt-1.5 text-[13px] font-bold leading-snug text-[var(--green)]">
                  Try it free — add a plan anytime
                </div>
              </button>
              {plans.map((p: any) => (
                <div
                  key={p._id}
                  className="relative"
                  onMouseEnter={() => setInfoPlan(p._id)}
                  onMouseLeave={() => setInfoPlan(null)}
                >
                  <button
                    type="button"
                    onClick={() => setPlanId(p._id)}
                    title={p.features?.length > 0 ? "Hover to see details" : undefined}
                    className={`w-full rounded-xl border-2 p-3 text-left transition ${
                      planId === p._id
                        ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md"
                    }`}
                  >
                    {p.popular && (
                      <span className="badge bg-emerald-600 text-white absolute -top-2 right-2">Popular</span>
                    )}
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      {p.name}
                      {p.features?.length > 0 && (
                        <span
                          className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                            infoPlan === p._id
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-emerald-200 bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          ℹ
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                      {formatINR(p.price)}
                      <span className="text-xs font-normal text-slate-500">/{p.billingCycle}</span>
                    </div>
                    {p.tagline && (
                      <div className="mt-1.5 text-[13px] font-bold leading-snug text-[var(--green)]">
                        {p.tagline}
                      </div>
                    )}
                  </button>

                  {infoPlan === p._id && p.features?.length > 0 && (
                    <div className="absolute right-0 top-full z-30 mt-1.5 w-[calc(100%+2rem)]">
                      <div className="absolute -top-1 right-6 h-2.5 w-2.5 rotate-45 rounded-tl border-l border-t border-slate-200 bg-white" />
                      <div
                        onClick={(e) => { e.stopPropagation(); setPlanId(p._id); setInfoPlan(null); }}
                        className="relative z-10 cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700 shadow-2xl"
                        style={{ animation: "popIn 0.15s ease-out" }}
                      >
                        <div className="border-b border-slate-100 pb-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-700 text-sm">{p.name}</span>
                            <span className="font-semibold text-slate-900">
                              {formatINR(p.price)}
                              <span className="text-[10px] text-slate-400">/{p.billingCycle}</span>
                            </span>
                          </div>
                          {p.tagline && <div className="mt-0.5 text-[11px] text-slate-500">{p.tagline}</div>}
                        </div>
                        <div className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          What&apos;s included
                        </div>
                        <ul className="mt-1.5 space-y-1.5">
                          {p.features.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                                ✓
                              </span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPlanId(p._id); setInfoPlan(null); }}
                          className="mt-3 w-full rounded-lg bg-emerald-600 py-1.5 text-center text-[11px] font-semibold text-white hover:bg-emerald-700"
                        >
                          Select {p.name}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? "Creating account..." : "Create Account & Get OTP"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}