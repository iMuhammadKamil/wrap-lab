"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, PackagePlus, Pencil, Plus, Star, Trash2, X } from "lucide-react";
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
import type { AdminSettings, CategoryWithCount, ProductWithCategory } from "../_components/types";

const BADGES = ["", "Bestseller", "New", "Popular", "Premium", "Veg", "Save 20%"];

type AddonRow = { name: string; price: string };

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductWithCategory | null;
  categories: CategoryWithCount[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = product !== null;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [categoryId, setCategoryId] = useState(product ? String(product.categoryId) : "");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [rating, setRating] = useState(product ? String(product.rating) : "4.0");
  const [addons, setAddons] = useState<AddonRow[]>(
    product ? product.addons.map((a) => ({ name: a.name, price: String(a.price) })) : []
  );
  const [saving, setSaving] = useState(false);

  function updateAddon(index: number, patch: Partial<AddonRow>) {
    setAddons((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Enter a valid price");
      return;
    }
    if (!categoryId) {
      toast.error("Select a category");
      return;
    }
    const cleanAddons = addons
      .filter((a) => a.name.trim())
      .map((a) => ({ name: a.name.trim(), price: Math.round(Number(a.price) || 0) }));

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Math.round(priceNum),
        categoryId: Number(categoryId),
        badge: badge || null,
        image: image.trim(),
        rating: Math.max(0, Math.min(5, Number(rating) || 4)),
        addons: cleanAddons,
      };
      if (editing && product) {
        await api(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Product updated");
      } else {
        await api("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Product created");
      }
      onClose();
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
      </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chicken Shawarma Wrap"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown on the menu"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="p-price">Price</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="350"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-cat">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="p-cat" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="p-badge">Badge</Label>
              <Select value={badge || "none"} onValueChange={(v) => setBadge(v === "none" ? "" : v)}>
                <SelectTrigger id="p-badge" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {BADGES.map((b) => (
                    <SelectItem key={b || "none"} value={b || "none"}>
                      {b || "None"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-rating">Rating (0–5)</Label>
              <Input
                id="p-rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="p-image">Image URL</Label>
            <Input
              id="p-image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Add-ons</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddons((rows) => [...rows, { name: "", price: "" }])}
              >
                <Plus className="size-3.5" />
                Add add-on
              </Button>
            </div>
            {addons.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 px-3 py-2.5 text-xs text-slate-400">
                No add-ons. Add extras like “Extra Cheese”.
              </p>
            ) : (
              <div className="space-y-2">
                {addons.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={a.name}
                      onChange={(e) => updateAddon(i, { name: e.target.value })}
                      placeholder="Extra Cheese"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={a.price}
                      onChange={(e) => updateAddon(i, { price: e.target.value })}
                      placeholder="50"
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAddons((rows) => rows.filter((_, j) => j !== i))}
                      aria-label="Remove add-on"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#d7b51a] text-[#2e2e2e] hover:bg-[#c4a417]">
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Product"}
          </Button>
        </DialogFooter>
    </>
  );
}

function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithCategory | null;
  categories: CategoryWithCount[];
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <ProductForm
            key={product?.id ?? "new"}
            product={product}
            categories={categories}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function DeleteProductButton({ product, onDeleted }: { product: ProductWithCategory; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
      toast.success(`"${product.name}" deactivated`);
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label="Delete product">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate “{product.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The product will be hidden from your storefront. You can re-enable it anytime.
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[] | null>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, c, s] = await Promise.all([
        api<ProductWithCategory[]>("/api/admin/products"),
        api<CategoryWithCount[]>("/api/admin/categories"),
        api<AdminSettings>("/api/admin/settings"),
      ]);
      setProducts(p);
      setCategories(c);
      setSettings(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load products");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  async function toggleActive(product: ProductWithCategory, active: boolean) {
    const prev = products;
    setProducts((list) => (list ?? []).map((p) => (p.id === product.id ? { ...p, isActive: active } : p)));
    try {
      await api(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: active }),
      });
      toast.success(active ? "Product activated" : "Product deactivated");
    } catch (e) {
      setProducts(prev);
      toast.error(e instanceof Error ? e.message : "Failed to update product");
    }
  }

  const currency = settings?.currency ?? "Rs.";

  return (
    <div>
      <PageHeader title="Products" description="Manage your menu items and add-ons">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-[#d7b51a] text-[#2e2e2e] hover:bg-[#c4a417]"
        >
          <Plus className="size-4" />
          Add Product
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {products === null ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<PackagePlus className="size-10" />}
                title="No products yet"
                hint="Add your first product to start selling."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Badge</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className={product.isActive ? "" : "opacity-50"}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="size-9 shrink-0 rounded-md border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                            <ImageIcon className="size-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1a1a1a]">{product.name}</p>
                          {product.addons.length > 0 && (
                            <p className="truncate text-xs text-slate-400">
                              {product.addons.length} add-on{product.addons.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {product.category.icon} {product.category.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#1a1a1a]">
                      {formatMoney(product.price, currency)}
                    </TableCell>
                    <TableCell>
                      {product.badge ? (
                        <Badge variant="outline" className="border-[#d7b51a]/50 bg-[#d7b51a]/10 text-[#a18711]">
                          {product.badge}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-slate-600">
                        <Star className="size-3.5 fill-[#d7b51a] text-[#d7b51a]" />
                        {product.rating.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={(checked) => toggleActive(product, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(product);
                            setDialogOpen(true);
                          }}
                          aria-label="Edit product"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteProductButton product={product} onDeleted={load} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
        onSaved={load}
      />
    </div>
  );
}