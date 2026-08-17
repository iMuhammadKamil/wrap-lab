import { create } from "zustand";

export interface CartItem {
  id: number;         // cart item id from DB (for API calls)
  productId: number;  // product id
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  badge: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  checkoutOpen: boolean;
  isLoading: boolean;
  // Local optimistic operations
  addItem: (item: Omit<CartItem, "quantity" | "id"> & { productId: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  // UI
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (productId: number) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  checkoutOpen: false,
  isLoading: false,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, id: 0, quantity: 1 }] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),
  setItems: (items) => set({ items }),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  openCheckout: () => set({ checkoutOpen: true, isOpen: false }),
  closeCheckout: () => set({ checkoutOpen: false }),

  getTotalItems: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),

  getTotalPrice: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  getItemQuantity: (productId) => {
    const item = get().items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  },
}));
