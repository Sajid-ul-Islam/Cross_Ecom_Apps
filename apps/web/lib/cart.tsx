"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Product } from "./api";
import { cacheGet, cacheSet, cacheClearAll, TTL } from "./cache";

export interface CartItem {
  product: Product;
  size: string;
  qty: number;
  variationId?: number;
}

interface CartCtx {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, size: string, qty?: number, variationId?: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQty: (productId: string, size: string, qty: number) => void;
  updateSize: (productId: string, oldSize: string, newSize: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartCtx | undefined>(undefined);
const CART_NAMESPACE = "cart";
const CART_KEY = "items";
const CART_TTL = 24 * 60 * 60 * 1000; // 24 hours — cart persists for a day

export const CASHBACK_TIERS = {
  tier1: { minSpend: 2500, cashback: 500 },
  tier2: { minSpend: 3000, cashback: 700 },
} as const;

export function getCashbackAmount(subtotal: number): number {
  if (subtotal >= 3000) return 700;
  if (subtotal >= 2500) return 500;
  return 0;
}

export const FREE_TEE_THRESHOLD = 2500; // backward compat

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from multi-layer cache on mount
  useEffect(() => {
    try {
      const saved = cacheGet<CartItem[]>(CART_NAMESPACE, CART_KEY, CART_TTL);
      if (saved && Array.isArray(saved)) {
        setItems(saved);
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Persist to multi-layer cache on change
  useEffect(() => {
    if (loaded) {
      cacheSet(CART_NAMESPACE, CART_KEY, items);
    }
  }, [items, loaded]);

  const addItem = useCallback((product: Product, size: string, qty: number = 1, variationId?: number) => {
    const addQty = Math.max(1, qty || 1);
    const resolvedVariationId =
      variationId ||
      product.variations?.find(
        (v: any) => String(v.size || "").toLowerCase() === String(size || "").toLowerCase()
      )?.id;
    setItems((prev) => {
      const existing = prev.find(
        (i) => String(i.product.id) === String(product.id) && i.size === size
      );
      if (existing) {
        return prev.map((i) =>
          String(i.product.id) === String(product.id) && i.size === size
            ? { ...i, qty: i.qty + addQty, variationId: resolvedVariationId || i.variationId }
            : i
        );
      }
      return [...prev, { product, size, qty: addQty, variationId: resolvedVariationId }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) =>
      prev.filter((i) => !(String(i.product.id) === String(productId) && i.size === size))
    );
  }, []);

  const updateQty = useCallback(
    (productId: string, size: string, qty: number) => {
      if (qty <= 0) {
        removeItem(productId, size);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          String(i.product.id) === String(productId) && i.size === size ? { ...i, qty } : i
        )
      );
    },
    [removeItem]
  );

  const updateSize = useCallback(
    (productId: string, oldSize: string, newSize: string) => {
      const cleanNew = String(newSize || "").trim();
      if (!cleanNew || oldSize === cleanNew) return;
      setItems((prev) => {
        const itemToChange = prev.find(
          (i) => String(i.product.id) === String(productId) && i.size === oldSize
        );
        if (!itemToChange) return prev;
        const newVariationId = itemToChange.product.variations?.find(
          (v: any) => String(v.size || "").toLowerCase() === cleanNew.toLowerCase()
        )?.id;
        const existing = prev.find(
          (i) => String(i.product.id) === String(productId) && i.size === cleanNew
        );
        if (existing) {
          return prev
            .filter((i) => !(String(i.product.id) === String(productId) && i.size === oldSize))
            .map((i) =>
              String(i.product.id) === String(productId) && i.size === cleanNew
                ? { ...i, qty: i.qty + itemToChange.qty, variationId: newVariationId || i.variationId }
                : i
            );
        }
        return prev.map((i) =>
          String(i.product.id) === String(productId) && i.size === oldSize
            ? { ...i, size: cleanNew, variationId: newVariationId || i.variationId }
            : i
        );
      });
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce(
    (s, i) => s + (i.product.salePrice ?? i.product.price) * i.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQty,
        updateSize,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
