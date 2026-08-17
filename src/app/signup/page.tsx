"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Building2, CheckCircle2, Globe, Loader2, Lock, Mail,
  MapPin, Phone, Sparkles, Store, User,
} from "lucide-react";

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_MIN = 3;
const SLUG_MAX = 30;

function deriveSlug(name: string): string {
  let s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length < SLUG_MIN) {
    s = (s ? s + "-" : "") + Math.random().toString(36).slice(2, 8);
  }
  return s.slice(0, SLUG_MAX);
}

export default function SignupPage() {
  const [host, setHost] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.role === "admin") {
          window.location.href = "/admin";
        }
      })
      .catch(() => {});
  }, []);

  const handleRestaurantName = (v: string) => {
    setRestaurantName(v);
    if (!slugEdited) setSlug(deriveSlug(v));
  };

  const slugValid =
    slug.length >= SLUG_MIN && slug.length <= SLUG_MAX && SLUG_REGEX.test(slug);
  const slugHasBadChars = /[^a-z0-9-]/.test(slug);
  const passwordMatch = confirm.length === 0 || password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (restaurantName.trim().length < 2) {
      setError("Restaurant name must be at least 2 characters");
      return;
    }
    if (!slugValid) {
      setError("Web address must be 3-30 characters and use only lowercase letters, numbers, and hyphens");
      return;
    }
    if (!name.trim()) {
      setError("Owner name is required");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          slug: slug.trim(),
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1200);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors duration-200 bg-[#242424] text-white placeholder:text-white/30";

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
        className="relative w-full max-w-lg"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#d7b51a]/10 border border-[#d7b51a]/30 mb-3">
            <Store className="w-7 h-7 text-[#d7b51a]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Launch your restaurant
          </h1>
          <p className="text-sm text-white/50 mt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#d7b51a]" />
            Your online store is ready in under a minute
          </p>
        </div>

        <div className="bg-[#2a2a2a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center text-center px-8 py-16">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
              >
                <CheckCircle2 className="w-16 h-16 text-[#d7b51a]" />
              </motion.div>
              <h2 className="text-2xl font-extrabold text-white mt-5">Your restaurant is live!</h2>
              <p className="text-sm text-white/50 mt-2">
                {host}/{slug} is ready. Taking you to your dashboard...
              </p>
              <div className="flex items-center gap-2 mt-6 text-[#d7b51a] text-sm font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" /> Redirecting
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
              <div>
                <label className="text-sm font-semibold text-white/70 mb-1.5 block">
                  Restaurant name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => handleRestaurantName(e.target.value)}
                    placeholder="e.g. Golden Burger House"
                    className={inputClass + " pl-10"}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/70 mb-1.5 block">
                  Web address
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    placeholder="your-store"
                    className={
                      inputClass +
                      " pl-10 font-mono " +
                      (slugHasBadChars
                        ? "border-red-500/70 focus:border-red-500"
                        : slugValid
                        ? "border-white/10 focus:border-[#d7b51a]"
                        : "border-amber-500/60 focus:border-amber-500")
                    }
                  />
                </div>
                <p className="text-xs mt-1.5 flex items-center gap-1 text-white/40">
                  <Globe className="w-3 h-3" />
                  {host || "your-domain"}/{slug || "your-store"}
                </p>
                {slugHasBadChars && (
                  <p className="text-xs text-red-400 mt-1">
                    Only lowercase letters, numbers, and hyphens are allowed
                  </p>
                )}
                {!slugHasBadChars && !slugValid && slug.length > 0 && (
                  <p className="text-xs text-amber-400 mt-1">
                    Use 3-30 characters, letters/numbers separated by single hyphens
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-white/5">
                <label className="text-sm font-semibold text-white/70 mb-1.5 block">Owner name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClass + " pl-10"}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/70 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass + " pl-10"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-white/70 mb-1.5 block">
                    Phone <span className="text-white/30 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03XX-XXXXXXX"
                      className={inputClass + " pl-10"}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white/70 mb-1.5 block">
                    Address <span className="text-white/30 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, city"
                      className={inputClass + " pl-10"}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-white/70 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className={inputClass + " pl-10"}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white/70 mb-1.5 block">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className={
                        inputClass +
                        " pl-10 " +
                        (passwordMatch ? "border-white/10 focus:border-[#d7b51a]" : "border-red-500/70 focus:border-red-500")
                      }
                    />
                  </div>
                  {!passwordMatch && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#d7b51a] text-black font-bold text-base rounded-full hover:bg-[#c4a517] transition-colors duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
                {isLoading ? "Creating your store..." : "Launch my restaurant"}
              </button>

              <p className="text-center text-xs text-white/35">
                Already have a restaurant?{" "}
                <a href="/" className="text-[#d7b51a] font-semibold hover:underline">
                  Back to home
                </a>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  );
}