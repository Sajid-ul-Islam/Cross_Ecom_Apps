"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "./api";

const WISHLIST_STORAGE_KEY = "deen_web_wishlist_v1";

interface WishlistContextType {
  wishlist: Product[];
  totalWishlist: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const saveWishlist = (items: Product[]) => {
    setWishlist(items);
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => String(p.id) === String(productId));
  };

  const toggleWishlist = (product: Product) => {
    const exists = isInWishlist(product.id);
    let next: Product[];
    if (exists) {
      next = wishlist.filter((p) => String(p.id) !== String(product.id));
    } else {
      next = [product, ...wishlist];
    }
    saveWishlist(next);
  };

  const removeFromWishlist = (productId: string) => {
    const next = wishlist.filter((p) => String(p.id) !== String(productId));
    saveWishlist(next);
  };

  const clearWishlist = () => {
    saveWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        totalWishlist: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
