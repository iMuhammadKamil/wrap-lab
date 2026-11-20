import fs from "fs";
import path from "path";
import type { Tenant } from "@prisma/client";
import {
  FALLBACK_CATEGORIES,
  FALLBACK_OFFERS,
  FALLBACK_PRODUCTS,
  FALLBACK_TENANTS,
} from "./fallback-data";

export function useLocalStore(): boolean {
  return !process.env.DATABASE_URL?.trim();
}

export interface LocalUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface LocalSession {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface LocalCategory {
  id: number;
  tenantId: string;
  name: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface LocalProduct {
  id: number;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
  badge: string | null;
  rating: number;
  isActive: boolean;
  addons: { id: number; name: string; price: number }[];
}

export interface LocalOffer {
  id: number;
  tenantId: string;
  title: string;
  description: string;
  code: string;
  icon: string;
  discountType: string;
  discountValue: number;
  minOrder: number;
  isActive: boolean;
  validUntil: string | null;
}

export interface LocalCartItem {
  id: number;
  tenantId: string;
  userId: string;
  productId: number;
  quantity: number;
  addons: string | null;
  createdAt: string;
}

export interface LocalOrderItem {
  id: number;
  tenantId: string;
  orderId: string;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  addons: string | null;
  lineTotal: number;
}

export interface LocalOrder {
  id: string;
  tenantId: string;
  userId: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  deliveryAddr: string;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  discountCode: string | null;
  discountAmt: number;
  total: number;
  estimatedMin: number;
  createdAt: string;
  items: LocalOrderItem[];
}

export interface LocalDb {
  nextId: number;
  tenants: Array<Omit<Tenant, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string }>;
  users: LocalUser[];
  sessions: LocalSession[];
  categories: LocalCategory[];
  products: LocalProduct[];
  offers: LocalOffer[];
  cartItems: LocalCartItem[];
  orders: LocalOrder[];
}

const DB_FILE = path.join(process.cwd(), ".local-db.json");
const ADMIN_HASH = "$2b$10$mfxYhazZ4e57i09ouSe5HOZpwc6Si7N9rK92k2qp3dB4N.Qk.kI8i"; // admin123

function createInitialDb(): LocalDb {
  const now = new Date().toISOString();
  let nextId = 1000;

  const tenants = FALLBACK_TENANTS.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const categories: LocalCategory[] = [];
  const products: LocalProduct[] = [];
  const offers: LocalOffer[] = [];

  for (const t of FALLBACK_TENANTS) {
    for (const c of FALLBACK_CATEGORIES[t.slug] ?? []) {
      categories.push({
        id: c.id,
        tenantId: t.id,
        name: c.name,
        icon: c.icon,
        sortOrder: c.sortOrder,
        isActive: true,
      });
    }
    for (const p of FALLBACK_PRODUCTS[t.slug] ?? []) {
      products.push({
        id: p.id,
        tenantId: t.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        categoryId: p.categoryId,
        badge: p.badge,
        rating: p.rating,
        isActive: p.isActive,
        addons: p.addons.map((a) => ({ id: nextId++, name: a.name, price: a.price })),
      });
    }
    for (const o of FALLBACK_OFFERS[t.slug] ?? []) {
      offers.push({
        id: o.id,
        tenantId: t.id,
        title: o.title,
        description: o.description,
        code: o.code,
        icon: o.icon,
        discountType: o.discountType,
        discountValue: o.discountValue,
        minOrder: o.minOrder,
        isActive: true,
        validUntil: null,
      });
    }
  }

  const users: LocalUser[] = [
    {
      id: "user-wraplab-admin",
      tenantId: "fallback-wraplab",
      name: "Wrap Lab Admin",
      email: "admin@wraplab.pk",
      phone: "03127777067",
      address: null,
      passwordHash: ADMIN_HASH,
      role: "admin",
      isActive: true,
      createdAt: now,
    },
    {
      id: "user-shawarma-admin",
      tenantId: "fallback-shawarma-palace",
      name: "Shawarma Palace Admin",
      email: "admin@shawarmapalace.pk",
      phone: "03001234567",
      address: null,
      passwordHash: ADMIN_HASH,
      role: "admin",
      isActive: true,
      createdAt: now,
    },
  ];

  return {
    nextId,
    tenants,
    users,
    sessions: [],
    categories,
    products,
    offers,
    cartItems: [],
    orders: [],
  };
}

export function readLocalDb(): LocalDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(raw) as LocalDb;
    }
  } catch {
    // re-create if corrupt
  }
  const initial = createInitialDb();
  writeLocalDb(initial);
  return initial;
}

export function writeLocalDb(data: LocalDb): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function toPrismaTenant(t: LocalDb["tenants"][number]): Tenant {
  return {
    ...t,
    createdAt: new Date(t.createdAt),
    updatedAt: new Date(t.updatedAt),
  };
}
