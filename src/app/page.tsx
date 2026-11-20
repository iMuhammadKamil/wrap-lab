"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, MapPin, Search, Sparkles, Store, UtensilsCrossed } from "lucide-react";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logo: string;
  primaryColor: string;
  phone: string;
  address: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  currency: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function safeColor(c: string, fallback: string): string {
  return HEX_RE.test(c) ? c : fallback;
}

const COVER_BY_SLUG: Record<string, string> = {
  wraplab: "/images/wrap.jpg",
  "shawarma-palace": "/images/shawarma.jpg",
};

const FALLBACK_COVERS = ["/images/deal.jpg", "/images/mandi.jpg", "/images/madbi.jpg"];

function getCoverImage(slug: string, index: number): string {
  return COVER_BY_SLUG[slug] ?? FALLBACK_COVERS[index % FALLBACK_COVERS.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "R";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function PlatformLandingPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.success && Array.isArray(d.data)) setRestaurants(d.data);
        else setError(true);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tagline.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
    );
  }, [restaurants, query]);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-stone-900">
              OrderHub
            </span>
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/login"
              className="px-3.5 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Restaurant Login
            </a>
            <a
              href="/signup"
              className="px-4 sm:px-5 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition-colors cursor-pointer shadow-sm"
            >
              Launch Storefront
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative bg-[#141416] text-white overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(215,181,26,0.18), transparent 65%)",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold uppercase tracking-widest text-amber-300 mb-6">
              <Store className="w-3.5 h-3.5" /> Restaurant Commerce Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-3xl mx-auto">
              Order local favorites or{" "}
              <span className="text-amber-400">launch your own restaurant</span>
            </h1>
            <p className="text-stone-300 text-base sm:text-lg mt-5 max-w-xl mx-auto leading-relaxed">
              Browse live restaurant menus below, or create a custom branded ordering storefront for your kitchen in under a minute.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-amber-400 text-stone-950 font-bold text-sm sm:text-base rounded-full hover:bg-amber-300 transition-colors cursor-pointer shadow-lg shadow-amber-400/20"
              >
                Create your storefront <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#restaurants"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 text-white font-semibold text-sm sm:text-base rounded-full hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
              >
                Browse Restaurants
              </a>
            </div>
          </div>
        </section>

        <section id="restaurants" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Featured Restaurants
              </h2>
              <p className="text-stone-500 text-sm sm:text-base mt-1">
                Order directly from local kitchens with zero middleman fees
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurant or area..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-stone-200 text-sm outline-none focus:border-stone-900 transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 animate-pulse"
                >
                  <div className="aspect-[16/9] bg-stone-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-stone-200 rounded w-1/2" />
                    <div className="h-3.5 bg-stone-200 rounded w-3/4" />
                    <div className="h-3.5 bg-stone-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
              <p className="text-stone-700 text-lg font-semibold">Could not load restaurants</p>
              <p className="text-stone-400 text-sm mt-1">Please refresh and try again</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
              <p className="text-stone-700 text-lg font-semibold">
                {query ? "No matching restaurants" : "No restaurants yet"}
              </p>
              <p className="text-stone-400 text-sm mt-1">
                {query ? "Try another search term" : "Be the first to launch on OrderHub"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((r, index) => {
                const accent = safeColor(r.primaryColor, "#d7b51a");
                const cover = getCoverImage(r.slug, index);
                return (
                  <a
                    key={r.id}
                    href={"/" + r.slug}
                    className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    <div className="relative aspect-[16/9] bg-stone-900 overflow-hidden">
                      <img
                        src={cover}
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-[11px] font-semibold text-stone-800 flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3 text-stone-600" />
                        25–35 min
                      </div>
                      <div className="absolute bottom-3 left-4 flex items-center gap-3">
                        {r.logo ? (
                          <img
                            src={r.logo}
                            alt={r.name}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md bg-white"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm text-white border-2 border-white shadow-md"
                            style={{ background: accent }}
                          >
                            {getInitials(r.name)}
                          </div>
                        )}
                        <div className="text-white drop-shadow">
                          <h3 className="text-lg font-bold leading-tight">{r.name}</h3>
                          <p className="text-xs text-white/85 font-medium">
                            {r.deliveryFee === 0
                              ? "Free delivery"
                              : `${r.currency} ${r.deliveryFee} delivery · Free ${r.currency} ${r.freeDeliveryThreshold}+`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      {r.tagline && (
                        <p className="text-sm text-stone-600 leading-relaxed line-clamp-2">
                          {r.tagline}
                        </p>
                      )}
                      {r.address && (
                        <p className="flex items-center gap-1.5 text-xs text-stone-400 mt-3">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
                          <span className="truncate">{r.address}</span>
                        </p>
                      )}
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-100 mt-4">
                        <span className="text-xs font-mono text-stone-400">/{r.slug}</span>
                        <span
                          className="inline-flex items-center gap-1.5 text-sm font-bold transition-all group-hover:gap-2.5"
                          style={{ color: accent }}
                        >
                          Order Now <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <section className="border-t border-stone-200/80 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> For Restaurant Owners
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mb-8">
              Build your own restaurant in 3 steps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Claim your storefront URL",
                  desc: "Sign up with your restaurant name, pick your brand color, and get an instant web link.",
                },
                {
                  step: "02",
                  title: "Add menu items & photos",
                  desc: "Upload food photography, set add-ons, delivery fees, and promo codes from your admin panel.",
                },
                {
                  step: "03",
                  title: "Accept customer orders",
                  desc: "Customers browse, customize add-ons, apply coupons, and place orders directly with you.",
                },
              ].map((item) => (
                <div key={item.step} className="p-6 rounded-2xl bg-[#fafaf9] border border-stone-200/80">
                  <span className="text-xs font-extrabold tracking-widest text-amber-600">
                    STEP {item.step}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 mt-2">{item.title}</h3>
                  <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="font-extrabold text-stone-900 text-sm">OrderHub</span>
          </div>
          <p className="text-xs text-stone-400 text-center">
            Multi-tenant restaurant ordering platform
          </p>
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <a href="/signup" className="hover:text-stone-900 transition-colors">
              Launch Store
            </a>
            <a href="/login" className="hover:text-stone-900 transition-colors">
              Admin Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
