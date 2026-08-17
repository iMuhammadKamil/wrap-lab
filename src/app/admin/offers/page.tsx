"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../_components/api";
import { formatMoney } from "../_components/format";
import { EmptyState, PageHeader } from "../_components/page-header";
import type { AdminSettings, Offer } from "../_components/types";

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "flat", label: "Flat amount" },
  { value: "free_delivery", label: "Free delivery" },
] as const;

function describeOffer(offer: Offer, currency: string): string {
  if (offer.discountType === "percentage") return `${offer.discountValue}% off`;
  if (offer.discountType === "flat") return `${formatMoney(offer.discountValue, currency)} off`;
  return "Free delivery";
}

function OfferForm({
  offer,
  currency,
  onClose,
  onSaved,
}: {
  offer: Offer | null;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = offer !== null;

  const [title, setTitle] = useState(offer?.title ?? "");
  const [description, setDescription] = useState(offer?.description ?? "");
  const [code, setCode] = useState(offer?.code ?? "");
  const [icon, setIcon] = useState(offer?.icon ?? "🎁");
  const [discountType, setDiscountType] = useState<string>(offer?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = useState(offer ? String(offer.discountValue) : "");
  const [minOrder, setMinOrder] = useState(offer ? String(offer.minOrder) : "0");
  const [validUntil, setValidUntil] = useState(
    offer?.validUntil ? new Date(offer.validUntil).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Offer title is required");
      return;
    }
    if (!code.trim()) {
      toast.error("Offer code is required");
      return;
    }
    const valueNum = Number(discountValue) || 0;
    if (discountType !== "free_delivery" && (valueNum <= 0 || Number.isNaN(valueNum))) {
      toast.error("Enter a valid discount value");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        code: code.trim().toUpperCase(),
        icon: icon.trim() || "🎁",
        discountType,
        discountValue: discountType === "free_delivery" ? 0 : Math.round(valueNum),
        minOrder: Math.max(0, Math.round(Number(minOrder) || 0)),
        validUntil: validUntil
          ? new Date(`${validUntil}T23:59:59`).toISOString()
          : null,
      };
      if (editing && offer) {
        await api(`/api/admin/offers/${offer.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Offer updated");
      } else {
        await api("/api/admin/offers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Offer created");
      }
      onClose();
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save offer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Offer" : "Add Offer"}</DialogTitle>
      </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="o-title">Title</Label>
              <Input
                id="o-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summer Special"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="o-code">Code</Label>
              <Input
                id="o-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER10"
                className="uppercase"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="o-desc">Description</Label>
            <Textarea
              id="o-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Show this on the offer banner"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="o-icon">Icon (emoji)</Label>
              <Input
                id="o-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🎁"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="o-type">Discount Type</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger id="o-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {discountType !== "free_delivery" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="o-value">
                  Value {discountType === "percentage" ? "(%)" : `(${currency})`}
                </Label>
                <Input
                  id="o-value"
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "10" : "150"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="o-min">Min Order</Label>
                <Input
                  id="o-min"
                  type="number"
                  min={0}
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="o-valid">Valid Until (optional)</Label>
            <Input
              id="o-valid"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#d7b51a] text-[#2e2e2e] hover:bg-[#c4a417]">
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Offer"}
          </Button>
        </DialogFooter>
    </>
  );
}

function OfferDialog({
  open,
  onOpenChange,
  offer,
  currency,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer | null;
  currency: string;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <OfferForm
            key={offer?.id ?? "new"}
            offer={offer}
            currency={currency}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function DeleteOfferButton({ offer, onDeleted }: { offer: Offer; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api(`/api/admin/offers/${offer.id}`, { method: "DELETE" });
      toast.success(`Offer "${offer.code}" deactivated`);
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete offer");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label="Delete offer">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate offer “{offer.code}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Customers will no longer be able to redeem this code.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {deleting ? "Deactivating…" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);

  const load = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([
        api<Offer[]>("/api/admin/offers"),
        api<AdminSettings>("/api/admin/settings"),
      ]);
      setOffers(o);
      setSettings(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load offers");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  async function toggleActive(offer: Offer, active: boolean) {
    const prev = offers;
    setOffers((list) => (list ?? []).map((o) => (o.id === offer.id ? { ...o, isActive: active } : o)));
    try {
      await api(`/api/admin/offers/${offer.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: active }),
      });
      toast.success(active ? "Offer activated" : "Offer deactivated");
    } catch (e) {
      setOffers(prev);
      toast.error(e instanceof Error ? e.message : "Failed to update offer");
    }
  }

  const currency = settings?.currency ?? "Rs.";

  return (
    <div>
      <PageHeader title="Offers" description="Discounts and coupon codes">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-[#d7b51a] text-[#2e2e2e] hover:bg-[#c4a417]"
        >
          <Plus className="size-4" />
          Add Offer
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {offers === null ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<TicketPercent className="size-10" />}
                title="No offers yet"
                hint="Create codes like WELCOME10 to attract customers."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Offer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="text-right">Min Order</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id} className={offer.isActive ? "" : "opacity-50"}>
                    <TableCell>
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        {offer.icon} {offer.title}
                      </p>
                      {offer.description && (
                        <p className="mt-0.5 max-w-56 truncate text-xs text-slate-400">
                          {offer.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-[#d7b51a]/50 bg-[#d7b51a]/10 font-mono font-semibold text-[#a18711]"
                      >
                        {offer.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {describeOffer(offer, currency)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">
                      {offer.minOrder > 0 ? formatMoney(offer.minOrder, currency) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {offer.validUntil
                        ? new Date(offer.validUntil).toLocaleDateString("en-PK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={offer.isActive}
                        onCheckedChange={(checked) => toggleActive(offer, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(offer);
                            setDialogOpen(true);
                          }}
                          aria-label="Edit offer"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteOfferButton offer={offer} onDeleted={load} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <OfferDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        offer={editing}
        currency={currency}
        onSaved={load}
      />
    </div>
  );
}