"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  Tags,
  TicketPercent,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { api } from "./_components/api";
import type { AdminSettings } from "./_components/types";

const NAV: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: UtensilsCrossed },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/offers", label: "Offers", icon: TicketPercent },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Store },
];

function SidebarContent({
  settings,
  pathname,
  onNavigate,
}: {
  settings: AdminSettings | null;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#d7b51a] text-lg font-extrabold text-[#2e2e2e]">
          {settings?.logo ? (
            <img src={settings.logo} alt="" className="size-8 rounded object-contain" />
          ) : (
            <span>{settings?.name?.charAt(0) ?? "A"}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{settings?.name ?? "Dashboard"}</p>
          <p className="truncate text-xs text-slate-400">{settings?.tagline ?? "Admin Panel"}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#d7b51a]/20 text-[#d7b51a]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {settings?.slug && (
        <div className="border-t border-white/10 px-4 py-4">
          <a
            href={`/${settings.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-slate-400 transition-colors hover:text-[#d7b51a]"
          >
            <ExternalLink className="size-3.5" />
            View storefront (/{settings.slug})
          </a>
        </div>
      )}
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((body) => {
        if (!body?.success || body.data?.role !== "admin") {
          window.location.replace("/");
          return;
        }
        setReady(true);
      })
      .catch(() => window.location.replace("/"));
  }, []);

  useEffect(() => {
    api<AdminSettings>("/api/admin/settings")
      .then(setSettings)
      .catch(() => {});
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — still redirect
    }
    window.location.replace("/");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f4]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#d7b51a] border-t-transparent" />
          <p className="text-sm text-slate-500">Checking access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#2e2e2e] lg:flex">
        <SidebarContent settings={settings} pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[#2e2e2e] shadow-xl">
            <SidebarContent
              settings={settings}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <p className="truncate text-sm font-semibold text-slate-700">
            {settings?.name ?? "Restaurant"} — Admin
          </p>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}