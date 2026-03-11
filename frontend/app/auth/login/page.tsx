"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("aios_token", data.accessToken);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mb-4 glow-blue">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Sign in to AIOS</h1>
          <p className="text-sm text-muted-foreground mt-1">The AI Ecosystem Operating System</p>
        </div>

        {/* Form */}
        <div className="glass-card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm placeholder-muted-foreground focus:outline-none focus:border-brand-500/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="Your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm placeholder-muted-foreground focus:outline-none focus:border-brand-500/40 transition-colors"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg btn-neon text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign up
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Demo: admin@aios.dev / Admin@123!
        </p>
      </motion.div>
    </div>
  );
}
