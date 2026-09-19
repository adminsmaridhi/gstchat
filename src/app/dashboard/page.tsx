"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import Loader from "@/components/Loader";
import { useAuth } from "@/components/AuthContext";
import { api, formatINR, timeAgo } from "@/lib/api";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    if (user?.planId) {
      setPlanLoading(true);
      api<any>("/plans")
        .then((d) => {
          const p = d.plans.find((x: any) => x._id === user.planId);
          if (p) setPlan(p);
        })
        .catch(() => {})
        .finally(() => setPlanLoading(false));
    }
  }, [user?.planId]);

  const rows = [
    ["Name", user?.name],
    ["Username", user?.username ? "@" + user.username : "—"],
    ["Email", user?.email],
    ["Mobile", user?.phone],
    ["GST Number", user?.gstNumber || "—"],
    ["Business Name", user?.businessName || "—"],
    ["Business Type", user?.businessType || "—"],
    ["PAN Number", user?.panNumber || "—"],
    ["Address", user?.address || "—"],
    ["City", user?.city || "—"],
    ["State", user?.state || "—"],
    ["Pincode", user?.pincode || "—"],
  ];

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
          <p className="text-sm text-slate-500">Your profile, GST & plan details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://wa.me/919693959083?text=Hi%20Smaridhi%2C%20I%20need%20help%20with%20my%20compliance"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            💬 Connect on WhatsApp
          </a>
          <Link href="/dashboard/chat" className="btn-primary">
            Open Chat
          </Link>
        </div>
      </div>

      {/* Plan card */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-emerald-100">Current Plan</div>
            <div className="mt-1 text-2xl font-black">
              {planLoading ? (
                <Loader className="justify-start !h-8" />
              ) : plan ? (
                plan.name
              ) : (
                "No plan yet"
              )}
            </div>
            {plan && (
              <>
                <div className="text-sm text-emerald-100">
                  {formatINR(plan.price)}/{plan.billingCycle}
                </div>
                {(plan.tagline || plan.description) && (
                  <div className="mt-1 text-sm font-semibold text-emerald-50">
                    {plan.tagline || plan.description}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-emerald-100">Status</div>
            <div className="mt-1 text-lg font-bold text-emerald-200">
              {user?.isVerified ? "✓ Verified" : "Unverified"}
            </div>
            <Link href="/dashboard/plans" className="text-sm text-white underline">
              {plan ? "Change plan" : "Choose a plan"}
            </Link>
          </div>
        </div>
      </div>

      {/* Profile / GST */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-900">Profile & GST Details</h2>
          <Link href="/dashboard/settings" className="text-sm font-medium text-emerald-600 hover:underline">
            Edit
          </Link>
        </div>
        <div className="grid gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(([k, v]) => (
            <div key={k}>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</div>
              <div className="mt-0.5 text-sm font-medium text-slate-800">{v || "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}