"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, storeAuth } from "@/lib/api";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(email, password);
      storeAuth(res.data.token, res.data.user);

      if (res.data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-rust/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-moss/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-ink-muted hover:text-ink mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-warm-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl text-ink tracking-tight">
                ms<span className="text-rust">.</span>rent
              </span>
            </Link>
            <p className="text-sm text-ink-muted">
              Masuk ke Panel Manajemen Garasi
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-ink mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@msrent.com"
                className="w-full px-3.5 py-2.5 bg-sand-50 rounded-xl border border-sand-200 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-rust focus:bg-white transition"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-sand-50 rounded-xl border border-sand-200 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-rust focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-sm transition shadow-warm-sm disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>
          </form>

          {/* Dev hint */}
          <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 text-center">
            <p className="text-[11px] text-ink-faint">
              Default: <span className="font-medium text-ink-muted">admin@msrent.com</span> / <span className="font-medium text-ink-muted">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
