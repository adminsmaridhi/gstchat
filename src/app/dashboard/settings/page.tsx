"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Spinner } from "@/components/Loader";
import { useAuth } from "@/components/AuthContext";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    gstNumber: user?.gstNumber || "",
    businessName: user?.businessName || "",
    businessType: user?.businessType || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    panNumber: user?.panNumber || "",
    companyEmail: user?.companyEmail || "",
  });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const d = await api<any>("/settings/profile", { method: "PATCH", body: JSON.stringify(profile) });
      updateUser(d.user);
      setSaved("Saved ✓");
      setTimeout(() => setSaved(""), 2000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const f = (k: string) => ({
    value: (profile as any)[k],
    onChange: (e: any) => setProfile({ ...profile, [k]: e.target.value }),
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Edit your profile.</p>
        </div>
        {saved && <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">{saved}</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-1 font-bold text-slate-900">Profile & GST</h2>
          <p className="mb-5 text-sm text-slate-500">Shown on your account page and to admins.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input className="input" {...f("name")} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" {...f("phone")} />
            </div>
            <div>
              <label className="label">GST Number</label>
              <input className="input" {...f("gstNumber")} />
            </div>
            <div>
              <label className="label">PAN Number</label>
              <input className="input" {...f("panNumber")} />
            </div>
            <div>
              <label className="label">Business Name</label>
              <input className="input" {...f("businessName")} />
            </div>
            <div>
              <label className="label">Business Type</label>
              <input className="input" {...f("businessType")} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" {...f("address")} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" {...f("city")} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" {...f("state")} />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" {...f("pincode")} />
            </div>
            <div>
              <label className="label">Company Email</label>
              <input className="input" {...f("companyEmail")} />
            </div>
          </div>
          <button className="btn-primary mt-6" onClick={saveProfile} disabled={saving}>
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4 border-2" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}