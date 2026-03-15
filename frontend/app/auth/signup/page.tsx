"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      localStorage.setItem("aios_token", data.accessToken);
      localStorage.setItem("aios_refresh_token", data.refreshToken);
      localStorage.setItem("aios_user", JSON.stringify(data.user));
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
          <h1 className="text-2xl font-bold gradient-text">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join the AI Ecosystem Operating System</p>
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
              <label className="text-xs font-medium text-muted-foreground block mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)} required
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm placeholder-muted-foreground focus:outline-none focus:border-brand-500/40 transition-colors"
                />
              </div>
            </div>

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
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm placeholder-muted-foreground focus:outline-none focus:border-brand-500/40 transition-colors"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm placeholder-muted-foreground focus:outline-none focus:border-brand-500/40 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg btn-neon text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
