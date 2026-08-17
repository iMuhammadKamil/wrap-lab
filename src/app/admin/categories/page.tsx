"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../_components/api";
import { EmptyState, PageHeader } from "../_components/page-header";
import type { CategoryWithCount } from "../_components/types";

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryWithCount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = category !== null;
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "🍽️");
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : "0");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        icon: icon.trim() || "🍽️",
        sortOrder: Number(sortOrder) || 0,
      };
      if (editing && category) {
        await api(`/api/admin/categories/${category.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Category updated");
      } else {
        await api("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Category created");
      }
      onClose();
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
      </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wraps"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="c-icon">Icon (emoji)</Label>
              <Input
                id="c-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🌯"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-sort">Sort Order</Label>
              <Input
                id="c-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#d7b51a] text-[#2e2e2e] hover:bg-[#c4a417]">
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Category"}
          </Button>
        </DialogFooter>
    </>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryWithCount | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent className="sm:max-w-md">
          <CategoryForm
            key={category?.id ?? "new"}
            category={category}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function DeleteCategoryButton({
  category,
  onDeleted,
}: {
  category: CategoryWithCount;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      toast.success(`"${category.name}" deactivated`);
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label="Delete category">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The category will be hidden from your storefront. Products in it remain active.
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryWithCount | null>(null);

  const load = useCallback(async () => {
    try {
      setCategories(await api<CategoryWithCount[]>("/api/admin/categories"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load categories");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  async function toggleActive(category: CategoryWithCount, active: boolean) {
    const prev = categories;
    setCategories((list) =>
      (list ?? []).map((c) => (c.id === category.id ? { ...c, isActive: active } : c))
    );
    try {
      await api(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: active }),
      });
      toast.success(active ? "Category activated" : "Category deactivated");
    } catch (e) {
      setCategories(prev);
      toast.error(e instanceof Error ? e.message : "Failed to update category");
    }
  }

  return (
    <div>
      <PageHeader title="Categories" description="Organize your menu">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-[#d7b51a] text-[#2e2e2e] hover:bg-[#c4a417]"
        >
          <Plus className="size-4" />
          Add Category
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {categories === null ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Tags className="size-10" />}
                title="No categories yet"
                hint="Create categories like Wraps, Shawarma, or Drinks."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Sort</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className={category.isActive ? "" : "opacity-50"}>
                    <TableCell>
                      <span className="flex items-center gap-3 text-sm font-semibold text-[#1a1a1a]">
                        <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-base">
                          {category.icon}
                        </span>
                        {category.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">
                      {category._count.products}
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-500">
                      {category.sortOrder}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={(checked) => toggleActive(category, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(category);
                            setDialogOpen(true);
                          }}
                          aria-label="Edit category"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteCategoryButton category={category} onDeleted={load} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        onSaved={load}
      />
    </div>
  );
}