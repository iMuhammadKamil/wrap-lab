"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../_components/api";
import { PageHeader } from "../_components/page-header";
import type { AdminSettings } from "../_components/types";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    tagline: "",
    logo: "",
    primaryColor: "#d7b51a",
    secondaryColor: "#333333",
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
    deliveryFee: "150",
    freeDeliveryThreshold: "1500",
    currency: "Rs.",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await api<AdminSettings>("/api/admin/settings");
      setForm({
        slug: s.slug,
        name: s.name,
        tagline: s.tagline,
        logo: s.logo,
        primaryColor: s.primaryColor,
        secondaryColor: s.secondaryColor,
        phone: s.phone,
        email: s.email,
        address: s.address,
        whatsapp: s.whatsapp,
        deliveryFee: String(s.deliveryFee),
        freeDeliveryThreshold: String(s.freeDeliveryThreshold),
        currency: s.currency,
        isActive: s.isActive,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Restaurant name is required");
      return;
    }
    for (const key of ["primaryColor", "secondaryColor"] as const) {
      if (!HEX_RE.test(form[key])) {
        toast.error(`${key === "primaryColor" ? "Primary" : "Secondary"} color must be a hex value like #d7b51a`);
        return;
      }
    }
    const deliveryFee = Number(form.deliveryFee);
    const freeDeliveryThreshold = Number(form.freeDeliveryThreshold);
    if (Number.isNaN(deliveryFee) || deliveryFee < 0) {
      toast.error("Delivery fee must be a valid amount");
      return;
    }
    if (Number.isNaN(freeDeliveryThreshold) || freeDeliveryThreshold < 0) {
      toast.error("Free delivery threshold must be a valid amount");
      return;
    }

    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          tagline: form.tagline.trim(),
          logo: form.logo.trim(),
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          whatsapp: form.whatsapp.trim(),
          deliveryFee: Math.round(deliveryFee),
          freeDeliveryThreshold: Math.round(freeDeliveryThreshold),
          currency: form.currency.trim() || "Rs.",
          isActive: form.isActive,
        }),
      });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Storefront details, branding and delivery rules">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#d7b51a] text-[#2e2e2e] hover:bg-[#c4a417]"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Storefront URL (read-only)</Label>
              <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
                <Building2 className="size-4 shrink-0 text-slate-400" />
                <span className="truncate font-mono">/{form.slug}</span>
              </div>
            </div>
            <Field id="s-name" label="Restaurant Name">
              <Input id="s-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field id="s-tagline" label="Tagline">
              <Input id="s-tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
            <Field id="s-logo" label="Logo URL">
              <Input id="s-logo" value={form.logo} onChange={(e) => set("logo", e.target.value)} placeholder="https://…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="s-primary" label="Primary Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    className="size-9 shrink-0 cursor-pointer rounded-md border border-slate-300 bg-white p-1"
                  />
                  <Input
                    id="s-primary"
                    value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    className="font-mono"
                  />
                </div>
              </Field>
              <Field id="s-secondary" label="Secondary Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => set("secondaryColor", e.target.value)}
                    className="size-9 shrink-0 cursor-pointer rounded-md border border-slate-300 bg-white p-1"
                  />
                  <Input
                    id="s-secondary"
                    value={form.secondaryColor}
                    onChange={(e) => set("secondaryColor", e.target.value)}
                    className="font-mono"
                  />
                </div>
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Field id="s-phone" label="Phone">
                  <Input id="s-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field id="s-email" label="Email">
                  <Input id="s-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
              </div>
              <Field id="s-address" label="Address">
                <Textarea
                  id="s-address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
              <Field id="s-whatsapp" label="WhatsApp" hint="Phone number used for WhatsApp links.">
                <Input id="s-whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery & Money</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-3 gap-3">
                <Field id="s-fee" label="Delivery Fee">
                  <Input id="s-fee" type="number" min={0} value={form.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} />
                </Field>
                <Field id="s-threshold" label="Free Above">
                  <Input id="s-threshold" type="number" min={0} value={form.freeDeliveryThreshold} onChange={(e) => set("freeDeliveryThreshold", e.target.value)} />
                </Field>
                <Field id="s-currency" label="Currency">
                  <Input id="s-currency" value={form.currency} onChange={(e) => set("currency", e.target.value)} />
                </Field>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">Storefront active</p>
                  <p className="text-xs text-slate-400">When off, the storefront shows a closed notice.</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => set("isActive", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}