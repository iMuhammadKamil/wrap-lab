"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, Mail, Store } from "lucide-react";

export default function RestaurantLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.role === "admin") {
          window.location.href = "/admin";
        } else {
          setError("This account is a customer account, not a restaurant admin.");
        }
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#1b1b1b] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(215,181,26,0.12), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 110%, rgba(215,181,26,0.06), transparent 60%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#d7b51a]/10 border border-[#d7b51a]/30 mb-3">
            <Store className="w-7 h-7 text-[#d7b51a]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Restaurant Dashboard
          </h1>
          <p className="text-sm text-white/50 mt-2">
            Sign in to manage your menu, orders, and storefront
          </p>
        </div>

        <div className="bg-[#242424]/90 backdrop-blur border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-[#d7b51a]" />
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourrestaurant.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-white/10 focus:border-[#d7b51a] text-sm outline-none transition-colors duration-200 bg-[#1b1b1b] text-white placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-[#d7b51a]" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl border-2 border-white/10 focus:border-[#d7b51a] text-sm outline-none transition-colors duration-200 bg-[#1b1b1b] text-white placeholder:text-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#d7b51a] hover:bg-[#e5c42b] text-[#1b1b1b] font-bold text-base rounded-full transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <a href="/" className="hover:text-white transition-colors">
              ← Back to OrderHub
            </a>
            <a href="/signup" className="text-[#d7b51a] font-semibold hover:underline">
              Create a restaurant
            </a>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
