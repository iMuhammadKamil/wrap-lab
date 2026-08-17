export type AdminSettings = {
  slug: string;
  name: string;
  tagline: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  currency: string;
  isActive: boolean;
};

export type ProductWithCategory = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
  badge: string | null;
  rating: number;
  isActive: boolean;
  category: { id: number; name: string; icon: string };
  addons: { id: number; name: string; price: number }[];
};

export type CategoryWithCount = {
  id: number;
  name: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
};

export type Offer = {
  id: number;
  title: string;
  description: string;
  code: string;
  icon: string;
  discountType: "percentage" | "flat" | "free_delivery";
  discountValue: number;
  minOrder: number;
  isActive: boolean;
  validUntil: string | null;
};

export type OrderItem = {
  id: number;
  orderId: string;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  addons: string | null;
  lineTotal: number;
};

export type Order = {
  id: string;
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
  items: OrderItem[];
};

export type Stats = {
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  productCount: number;
};