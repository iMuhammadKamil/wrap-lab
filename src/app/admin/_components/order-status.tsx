import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "delivered"];

export const STATUS_META: Record<
  OrderStatus,
  { label: string; badge: string; dot: string }
> = {
  pending: { label: "Pending", badge: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  confirmed: { label: "Confirmed", badge: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  preparing: { label: "Preparing", badge: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  delivered: { label: "Delivered", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", badge: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = isOrderStatus(status) ? STATUS_META[status] : null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        meta ? meta.badge : "bg-slate-100 text-slate-700 border-slate-200",
        className
      )}
    >
      {meta?.label ?? status}
    </Badge>
  );
}