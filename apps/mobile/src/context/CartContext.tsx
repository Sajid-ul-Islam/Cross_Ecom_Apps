import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartItem, Product, DeliveryArea } from "../types";
import { DELIVERY_FEES, FREE_TEE_THRESHOLD } from "../services/gateway";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string, qty?: number, variationId?: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQty: (productId: string, size: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  freeTeeEligible: boolean;
  freeTeeGap: number;
  getDeliveryFee: (area: DeliveryArea) => number;
  calculateTotal: (area: DeliveryArea) => number;
}

const CART_STORAGE_KEY = "deen_mobile_cart_v1";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (json) setCart(JSON.parse(json));
      } catch (e) {
        console.error("Failed to load cart", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)).catch(console.error);
    }
  }, [cart, loaded]);

  const addToCart = (product: Product, size: string, qty = 1, variationId?: number) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.size === size
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].qty += qty;
        return copy;
      }
      return [...prev, { productId: product.id, product, size, qty, variationId } as CartItem];
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.productId === productId && item.size === size)));
  };

  const updateQty = (productId: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId && item.size === size) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => {
    const unitPrice = item.product.salePrice ?? item.product.price;
    return acc + unitPrice * item.qty;
  }, 0);

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  // Cashback campaign calculation:
  // - ৳500 cashback on ৳2,500+
  // - ৳700 cashback on ৳3,000+
  let cashbackAmount = 0;
  let cashbackTier = 0;
  let cashbackGap = 0;

  if (subtotal >= 3000) {
    cashbackAmount = 700;
    cashbackTier = 2;
    cashbackGap = 0;
  } else if (subtotal >= 2500) {
    cashbackAmount = 500;
    cashbackTier = 1;
    cashbackGap = 3000 - subtotal; // to reach ৳700 tier
  } else {
    cashbackAmount = 0;
    cashbackTier = 0;
    cashbackGap = 2500 - subtotal; // to reach ৳500 tier
  }

  const freeTeeEligible = cashbackAmount > 0;
  const freeTeeGap = cashbackGap;

  const getDeliveryFee = (area: DeliveryArea) => DELIVERY_FEES[area] ?? 50;
  const calculateTotal = (area: DeliveryArea) => Math.max(0, subtotal - cashbackAmount) + getDeliveryFee(area);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        subtotal,
        totalItems,
        cashbackAmount,
        cashbackTier,
        cashbackGap,
        freeTeeEligible,
        freeTeeGap,
        getDeliveryFee,
        calculateTotal,
      } as any}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
