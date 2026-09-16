"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthContext";
import Loader, { Spinner } from "@/components/Loader";
import { api, formatINR } from "@/lib/api";
import { Check, X, Plus, Pencil, Trash2, Star } from "lucide-react";

export default function PlansPage() {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<any>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const isAdmin = user?.role === "admin";

  const load = () => {
    api<any>("/plans?all=1")
      .then((d) => {
        setPlans(d.plans);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const subscribe = async (id: string) => {
    setMessage("");
    setSubscribing(id);
    try {
      const d = await api<any>(`/plans/${id}/subscribe`, { method: "POST" });
      setMessage(`Subscribed to ${d.plan.name} 🎉`);
      const me: any = await api("/auth/me");
      updateUser(me.user);
      load();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSubscribing(null);
    }
  };

  const savePlan = async () => {
    setSavingPlan(true);
    try {
      if (modal._id) {
        await api(`/plans/${modal._id}`, {
          method: "PUT",
          body: JSON.stringify(modal),
        });
      } else {
        await api("/plans", { method: "POST", body: JSON.stringify(modal) });
      }
      setModal(null);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const deactivatePlan = async (id: string) => {
    await api(`/plans/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pricing Plans</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? "Manage subscription tiers" : "Pick the plan that fits your business"}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setModal({ name: "", description: "", price: 0, billingCycle: "monthly", features: [], popular: false, active: true })}>
            <Plus className="h-4 w-4" /> New Plan
          </button>
        )}
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {loading ? (
        <Loader label="Loading plans..." className="py-24" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {plans.map((p: any) => {
          const isCurrent = user?.planId === p._id;
          const features = Array.isArray(p.features) ? p.features : [];
          return (
            <div
              key={p._id}
              className={`card relative flex flex-col ${p.popular ? "ring-2 ring-emerald-600" : ""}`}
            >
              {p.popular && (
                <span className="badge absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white">
                  <Star className="mr-1 h-3 w-3" /> Most Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                {!p.active && <span className="badge bg-slate-100 text-slate-500">Inactive</span>}
              </div>
              <p className="mt-1 text-sm text-slate-500">{p.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">{formatINR(p.price)}</span>
                <span className="text-sm text-slate-400">/{p.billingCycle}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
                {features.length === 0 && (
                  <li className="text-sm text-slate-400">No features listed</li>
                )}
              </ul>

              {isAdmin ? (
                <div className="mt-6 flex gap-2">
                  <button className="btn-secondary flex-1" onClick={() => setModal(p)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button className="btn-danger" onClick={() => deactivatePlan(p._id)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : isCurrent ? (
                <div className="mt-6">
                  <div className="btn-secondary w-full cursor-default justify-center">Current plan</div>
                </div>
              ) : (
                <button className="btn-primary mt-6 w-full" onClick={() => subscribe(p._id)} disabled={(p.price === 0 && isCurrent) || subscribing === p._id}>
                  {subscribing === p._id ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4 border-2" /> Subscribing...
                    </span>
                  ) : p.price === 0 ? (
                    "Start Free"
                  ) : (
                    `Subscribe · ${formatINR(p.price)}`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Admin plan editor */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-lg font-bold">{modal._id ? "Edit Plan" : "Create Plan"}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" className="input" value={modal.price} onChange={(e) => setModal({ ...modal, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Billing Cycle</label>
                  <select className="input" value={modal.billingCycle} onChange={(e) => setModal({ ...modal, billingCycle: e.target.value })}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Features (one per line)</label>
                <textarea
                  className="input"
                  rows={5}
                  value={modal.features.join("\n")}
                  onChange={(e) => setModal({ ...modal, features: e.target.value.split("\n").filter((x: string) => x.trim()) })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={modal.popular} onChange={(e) => setModal({ ...modal, popular: e.target.checked })} />
                Mark as popular
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={modal.active} onChange={(e) => setModal({ ...modal, active: e.target.checked })} />
                Active
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn-primary" onClick={savePlan} disabled={savingPlan}>
                  {savingPlan ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="h-4 w-4 border-2" /> Saving...
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}