"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  image: string;
  size?: string;
  price: number;
  quantity: number;
  /** Set only for items that were added as part of a combo — used to
   * visually group and label them together in the cart, and to identify
   * which one line carries the full combo price (the rest are priced at
   * 0 but still fulfil and deduct stock normally). */
  comboId?: string;
  comboName?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addCombo: (combo: {
    id: string;
    name: string;
    comboPrice: number;
    items: {
      productId: string;
      variantId?: string;
      productName: string;
      productSlug: string;
      productImage: string;
      quantity: number;
    }[];
  }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  removeCombo: (comboId: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "royal-fragrance-cart";

function sameLine(a: CartItem, productId: string, variantId?: string) {
  return a.productId === productId && a.variantId === variantId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Ignore malformed cart data.
    }
    setHydrated(true);
  }, []);

  // Persist on every change, after initial hydration.
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const existing = prev.find((p) =>
        sameLine(p, item.productId, item.variantId)
      );
      if (existing) {
        return prev.map((p) =>
          sameLine(p, item.productId, item.variantId)
            ? { ...p, quantity: p.quantity + item.quantity }
            : p
        );
      }
      return [...prev, item];
    });
  }

  function addCombo(combo: {
    id: string;
    name: string;
    comboPrice: number;
    items: {
      productId: string;
      variantId?: string;
      productName: string;
      productSlug: string;
      productImage: string;
      quantity: number;
    }[];
  }) {
    // First component carries the full combo price; the rest are priced
    // at 0 — this is what lets checkout, stock deduction, and order
    // records treat combo lines as ordinary order_items with no further
    // schema or logic changes needed anywhere else.
    const newLines: CartItem[] = combo.items.map((item, index) => ({
      productId: item.productId,
      variantId: item.variantId,
      slug: item.productSlug,
      name: item.productName,
      image: item.productImage,
      price: index === 0 ? combo.comboPrice : 0,
      quantity: item.quantity,
      comboId: combo.id,
      comboName: combo.name,
    }));
    setItems((prev) => [...prev, ...newLines]);
  }

  function removeItem(productId: string, variantId?: string) {
    setItems((prev) => prev.filter((p) => !sameLine(p, productId, variantId)));
  }

  function removeCombo(comboId: string) {
    setItems((prev) => prev.filter((p) => p.comboId !== comboId));
  }

  function updateQuantity(
    productId: string,
    quantity: number,
    variantId?: string
  ) {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((p) =>
        sameLine(p, productId, variantId) ? { ...p, quantity } : p
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addCombo,
        removeItem,
        removeCombo,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
