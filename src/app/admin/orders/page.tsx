"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ClipboardList, MapPin, Phone, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "../_components/api";
import { formatDateTime, formatMoney } from "../_components/format";
import {
  OrderStatusBadge,
  STATUS_META,
  isOrderStatus,
  nextStatus,
  ORDER_STATUSES,
  type OrderStatus,
} from "../_components/order-status";
import { EmptyState, PageHeader } from "../_components/page-header";
import type { AdminSettings, Order, OrderItem } from "../_components/types";

function parseAddons(item: OrderItem): string[] {
  if (!item.addons) return [];
  try {
    const parsed = JSON.parse(item.addons);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (status: string) => {
    try {
      const query = status && status !== "all" ? `?status=${status}` : "";
      const [o, s] = await Promise.all([
        api<Order[]>(`/api/admin/orders${query}`),
        api<AdminSettings>("/api/admin/settings"),
      ]);
      setOrders(o);
      setSettings(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load(filter);
    })();
  }, [filter]);

  async function setStatus(order: Order, status: string) {
    setUpdatingId(order.id);
    try {
      const updated = await api<Order>(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((list) =>
        (list ?? []).map((o) => (o.id === order.id ? { ...o, status: updated.status } : o))
      );
      const meta = isOrderStatus(status) ? STATUS_META[status] : null;
      toast.success(`Order ${order.orderNumber} → ${meta?.label ?? status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  }

  const currency = settings?.currency ?? "Rs.";
  const isTerminal = (status: string) => status === "delivered" || status === "cancelled";

  return (
    <div>
      <PageHeader title="Orders" description="Track and manage incoming orders">
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(value) => {
              setFilter(value);
              setOrders(null);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => load(filter)} aria-label="Refresh orders">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {orders === null ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<ClipboardList className="size-10" />}
                title="No orders found"
                hint={filter === "all" ? "Orders will appear here as customers place them." : "No orders with this status yet."}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead className="w-40 text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const expanded = expandedId === order.id;
                  const next = nextStatus(order.status as OrderStatus);
                  const updating = updatingId === order.id;
                  const addonCount = order.items.reduce((n, it) => n + parseAddons(it).length, 0);

                  return (
                    <Fragment key={order.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                      >
                        <TableCell>
                          {expanded ? (
                            <ChevronDown className="size-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="size-4 text-slate-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-[#1a1a1a]">{order.orderNumber}</p>
                          <p className="text-xs text-slate-400">
                            {order.items.length} item{order.items.length > 1 ? "s" : ""}
                            {addonCount > 0 && ` · ${addonCount} add-on${addonCount > 1 ? "s" : ""}`}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-700">{order.customerName}</p>
                          <p className="text-xs text-slate-400">{order.customerPhone}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[#1a1a1a]">
                          {formatMoney(order.total, currency)}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {next && (
                              <Button
                                size="sm"
                                disabled={updating}
                                className="bg-[#d7b51a] text-[#2e2e2e] hover:bg-[#c4a417]"
                                onClick={() => setStatus(order, next)}
                              >
                                {updating ? "…" : `→ ${STATUS_META[next].label}`}
                              </Button>
                            )}
                            {!isTerminal(order.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={updating}
                                onClick={() => setStatus(order, "cancelled")}
                              >
                                <XCircle className="size-3.5" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                          <TableCell colSpan={7}>
                            <div className="px-2 py-3">
                              <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Items
                                  </p>
                                  <div className="divide-y divide-slate-200/70 rounded-md border border-slate-200 bg-white">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="flex items-start justify-between gap-3 px-3 py-2">
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-[#1a1a1a]">
                                            {item.quantity} × {item.productName}
                                          </p>
                                          {parseAddons(item).length > 0 && (
                                            <p className="mt-0.5 text-xs text-slate-400">
                                              + {parseAddons(item).join(", ")}
                                            </p>
                                          )}
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold text-slate-700">
                                          {formatMoney(item.lineTotal, currency)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Details
                                  </p>
                                  <p className="flex items-center gap-2 text-slate-600">
                                    <Phone className="size-3.5 text-slate-400" />
                                    {order.customerPhone} · {order.paymentMethod.toUpperCase()}
                                  </p>
                                  <p className="flex items-start gap-2 text-slate-600">
                                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                                    {order.deliveryAddr}
                                  </p>
                                  {order.notes && (
                                    <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">
                                      Note: {order.notes}
                                    </p>
                                  )}
                                  <div className="space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-500">
                                    <p className="flex justify-between">
                                      <span>Subtotal</span>
                                      <span>{formatMoney(order.subtotal, currency)}</span>
                                    </p>
                                    {order.discountAmt > 0 && (
                                      <p className="flex justify-between text-emerald-600">
                                        <span>Discount ({order.discountCode})</span>
                                        <span>− {formatMoney(order.discountAmt, currency)}</span>
                                      </p>
                                    )}
                                    <p className="flex justify-between">
                                      <span>Delivery</span>
                                      <span>
                                        {order.deliveryFee === 0 ? "Free" : formatMoney(order.deliveryFee, currency)}
                                      </span>
                                    </p>
                                    <p className="flex justify-between text-sm font-bold text-[#1a1a1a]">
                                      <span>Total</span>
                                      <span>{formatMoney(order.total, currency)}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}