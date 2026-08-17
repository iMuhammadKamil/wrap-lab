"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Store, UtensilsCrossed } from "lucide-react";

interface Restaurant {
  id: string; slug: string; name: string; tagline: string; logo: string;
  primaryColor: string; phone: string; address: string;
  deliveryFee: number; freeDeliveryThreshold: number; currency: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function safeColor(c: string, fallback: string): string {
  return HEX_RE.test(c) ? c : fallback;
}

export default function PlatformLandingPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.success && Array.isArray(d.data)) setRestaurants(d.data);
        else setError(true);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">OrderHub</span>
          </a>
          <a href="/signup" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-700 transition-colors cursor-pointer">Get Started</a>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 text-center">
            <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-amber-400 mb-5">
              <Store className="w-4 h-4" /> Multi-tenant ordering platform
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
              Your restaurant, <span className="text-amber-400">online in minutes</span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg mt-5 max-w-xl mx-auto">
              Launch a branded online ordering storefront for your restaurant. No website skills needed — we handle the menu, cart, checkout and delivery.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <a href="/signup" className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-400 text-gray-900 font-bold text-base rounded-full hover:bg-amber-300 transition-colors cursor-pointer">
                Create your storefront <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Restaurants on OrderHub</h2>
            <p className="text-gray-500 mt-2">Order directly from your favorite local restaurants</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-2" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">😕</p>
              <p className="text-gray-500 text-lg font-medium">Could not load restaurants</p>
              <p className="text-gray-400 text-sm mt-1">Please try again later</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🍽️</p>
              <p className="text-gray-500 text-lg font-medium">No restaurants yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to join OrderHub</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {restaurants.map((r) => {
                const accent = safeColor(r.primaryColor, "#d7b51a");
                return (
                  <a key={r.id} href={"/" + r.slug} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col cursor-pointer">
                    <div className="h-2" style={{ background: accent }} />
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{r.name}</h3>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: accent + "1f" }}>
                          <UtensilsCrossed className="w-5 h-5" style={{ color: accent }} />
                        </div>
                      </div>
                      {r.tagline && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{r.tagline}</p>}
                      {r.address && (
                        <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />{r.address}
                        </p>
                      )}
                      <div className="mt-auto pt-5">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors group-hover:gap-2.5" style={{ color: accent }}>
                          View Menu <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-extrabold text-gray-900">OrderHub</span>
          </div>
          <p className="text-xs text-gray-400 text-center">OrderHub — multi-tenant ordering SaaS</p>
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Home</a>
        </div>
      </footer>
    </div>
  );
}