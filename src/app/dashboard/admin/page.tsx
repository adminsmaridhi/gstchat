"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Spinner } from "@/components/Loader";
import { useAuth } from "@/components/AuthContext";
import { api, timeAgo } from "@/lib/api";

export default function AdminPage() {
  const { user } = useAuth();
  const isSuper = user?.role === "superadmin";
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [tab, setTab] = useState<"users" | "admins">("users");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api<any>("/admin/stats").then(setStats).catch(() => {}),
      api<any>("/admin/users?role=user").then((d) => setUsers(d.users)).catch(() => {}),
      isSuper ? api<any>("/admin/admins").then((d) => setAdmins(d.admins)).catch(() => {}) : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [isSuper]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (id: string, active: boolean) => {
    await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !active }) });
    load();
  };

  const promote = async (id: string) => {
    await api(`/admin/admins/${id}/promote`, { method: "POST" });
    load();
  };

  const demote = async (id: string) => {
    await api(`/admin/admins/${id}/demote`, { method: "POST" });
    load();
  };

  const cards = [
    ["Customers", stats?.totalUsers ?? 0],
    ["Active", stats?.activeUsers ?? 0],
    ["Chat messages", stats?.totalMessages ?? 0],
    ["Plans", stats?.totalPlans ?? 0],
  ];

  return (
    <DashboardShell>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Manage Users</h1>
      <p className="mb-6 text-sm text-slate-500">
        {isSuper ? "Super Admin — you can promote or remove admins." : "Admin — you can manage customers."}
      </p>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-slate-100" />
            ))
          : cards.map(([label, value]: any) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-black text-slate-900">{value}</div>
                <div className="text-sm text-slate-500">{label}</div>
              </div>
            ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-900">
            {tab === "users" ? "Customers" : "Admins"}
          </h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setTab("users")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "users" ? "bg-white shadow-sm" : "text-slate-500"}`}
            >
              Customers
            </button>
            {isSuper && (
              <button
                onClick={() => setTab("admins")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "admins" ? "bg-white shadow-sm" : "text-slate-500"}`}
              >
                Admins ({admins.length})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
                <th className="px-6 py-3">Name / Login</th>
                <th className="px-4 py-3">Business / GST</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                {isSuper && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Spinner className="h-5 w-5 border-2" /> Loading {tab === "users" ? "customers" : "admins"}...
                    </div>
                  </td>
                </tr>
              ) : (
              <>
              {(tab === "users" ? users : admins).map((u: any) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3">
                    <div className="font-semibold text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-400">
                      {u.username ? "@" + u.username : ""} {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{u.businessName || "—"}</div>
                    <div className="text-xs text-slate-400">{u.gstNumber || "No GST"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{timeAgo(u.createdAt)}</td>
                  {isSuper && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {tab === "users" ? (
                          <>
                            {u.isActive ? (
                              <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => toggleActive(u.id, u.isActive)}>
                                Suspend
                              </button>
                            ) : (
                              <button className="btn-secondary px-2.5 py-1 text-xs text-emerald-600" onClick={() => toggleActive(u.id, u.isActive)}>
                                Reactivate
                              </button>
                            )}
                            <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => promote(u.id)}>
                              Make Admin
                            </button>
                          </>
                        ) : (
                          u.role === "admin" && (
                            <button className="btn-danger px-2.5 py-1 text-xs" onClick={() => demote(u.id)}>
                              Remove Admin
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {(tab === "users" ? users : admins).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Nothing here yet.</td>
                </tr>
              )}
              </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}