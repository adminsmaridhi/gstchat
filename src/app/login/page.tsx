"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      login(data.token, data.user);
      router.push("/dashboard/chat");
    } catch (err: any) {
      // Unverified account: redirect to the 6-digit OTP verify screen
      if (err.status === 428 && err.data?.requiresOtp) {
        router.push(`/verify?email=${encodeURIComponent(err.data.email)}&userId=${err.data.userId}`);
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <img
              src="/logo.jpeg"
              alt="Smaridhi logo"
              className="mx-auto mb-4 h-16 w-auto"
              style={{ objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </Link>
          <p className="mt-1 text-sm text-slate-500">Sign in to your compliance workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="label">Username, Email or Mobile</label>
            <input
              className="input"
              placeholder="e.g. rahultest"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Signing in..." : "Sign In With Smaridhi"}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link href="/forgot" className="font-semibold text-emerald-600 hover:underline">
              Forgot password?
            </Link>
          </p>

          <p className="text-center text-sm text-slate-500">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-emerald-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
