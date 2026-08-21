import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../types";
import { useNotifications } from "./NotificationContext";

const WISHLIST_STORAGE_KEY = "deen_mobile_wishlist_v1";

interface WishlistContextType {
  wishlist: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
        if (json) {
          setWishlist(JSON.parse(json));
        }
      } catch (e) {
        console.error("Failed to load wishlist", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveWishlist = async (items: Product[]) => {
    setWishlist(items);
    await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => String(p.id) === String(productId));
  };

  const toggleWishlist = async (product: Product) => {
    const exists = isInWishlist(product.id);
    let next: Product[];
    if (exists) {
      next = wishlist.filter((p) => String(p.id) !== String(product.id));
    } else {
      next = [product, ...wishlist];
      // Trigger price-drop alert preview
      if (product.salePct && product.salePct > 0) {
        addNotification({
          type: "PROMO",
          title: `🏷️ Saved Item on Sale: ${product.name}`,
          body: `An item in your wishlist has an active ${product.salePct}% discount. Grab it while stocks last!`,
          actionUrl: `/product/${product.id}`,
          actionLabel: "View Product",
        });
      }
    }
    await saveWishlist(next);
  };

  const removeFromWishlist = async (productId: string) => {
    const next = wishlist.filter((p) => String(p.id) !== String(productId));
    await saveWishlist(next);
  };

  const clearWishlist = async () => {
    await saveWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
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
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
