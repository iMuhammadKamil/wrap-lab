"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "./_components/api";
import { formatDateTime, formatMoney } from "./_components/format";
import { OrderStatusBadge } from "./_components/order-status";
import { EmptyState, PageHeader } from "./_components/page-header";
import type { AdminSettings, Order, Stats } from "./_components/types";

function StatCard({
  label,
  value,
  icon,
  highlight,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
  loading: boolean;
}) {
  return (
    <Card className={highlight ? "border-[#d7b51a]/60" : ""}>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={
            highlight
              ? "flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#d7b51a] text-[#2e2e2e]"
              : "flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
          }
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-24" />
          ) : (
            <p className="truncate text-xl font-bold text-[#1a1a1a]">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [s, o, st] = await Promise.all([
        api<Stats>("/api/admin/stats"),
        api<Order[]>("/api/admin/orders"),
        api<AdminSettings>("/api/admin/settings"),
      ]);
      setStats(s);
      setOrders(o);
      setSettings(st);
    } catch (e) {
      setError(true);
      toast.error(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  const currency = settings?.currency ?? "Rs.";
  const recent = orders.slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" description="Your restaurant at a glance" />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">Could not load dashboard data.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Revenue"
            value={formatMoney(stats?.revenue ?? 0, currency)}
            icon={<Wallet className="size-5" />}
            highlight
            loading={loading}
          />
          <StatCard
            label="Total Orders"
            value={String(stats?.totalOrders ?? 0)}
            icon={<ShoppingBag className="size-5" />}
            loading={loading}
          />
          <StatCard
            label="Pending Orders"
            value={String(stats?.pendingOrders ?? 0)}
            icon={<Clock className="size-5" />}
            loading={loading}
          />
          <StatCard
            label="Products"
            value={String(stats?.productCount ?? 0)}
            icon={<UtensilsCrossed className="size-5" />}
            loading={loading}
          />
        </div>
      )}

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm font-medium text-[#b8960e] hover:underline"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="size-10" />}
              title="No orders yet"
              hint="New orders will appear here as customers place them."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1a1a1a]">
                      {order.orderNumber}
                      <span className="ml-2 font-normal text-slate-500">
                        {order.customerName}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} className="hidden sm:inline-flex" />
                  <p className="text-sm font-bold text-[#1a1a1a]">
                    {formatMoney(order.total, currency)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}