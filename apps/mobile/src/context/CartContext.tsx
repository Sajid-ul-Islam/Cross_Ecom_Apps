import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartItem, Product, DeliveryArea } from "../types";
import { DELIVERY_FEES, fetchCashback, fetchPricing } from "../services/gateway";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string, qty?: number, variationId?: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQty: (productId: string, size: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  cashbackAmount: number;
  cashbackTier: number;
  cashbackGap: number;
  bogoDiscount: number;
  bogoFreeIndexes: number[];
  getDeliveryFee: (area: DeliveryArea) => number;
  calculateTotal: (area: DeliveryArea) => number;
  setDeliveryArea: (area: DeliveryArea) => void;
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

  // Cashback + BOGO + delivery are ALL sourced from the gateway (Woo), never
  // computed locally. fetchPricing mirrors exactly what the order route charges,
  // so the bag and checkout never disagree and admin can change fees in WP.
  const [cashbackAmount, setCashbackAmount] = useState(0);
  const [cashbackTier, setCashbackTier] = useState(0);
  const [cashbackGap, setCashbackGap] = useState(0);
  const [bogoDiscount, setBogoDiscount] = useState(0);
  const [bogoFreeIndexes, setBogoFreeIndexes] = useState<number[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<{ insideDhaka: number; outsideDhaka: number; express: number; storePickup: number }>(
    { insideDhaka: 50, outsideDhaka: 90, express: 120, storePickup: 0 }
  );
  const [area, setArea] = useState<DeliveryArea>("dhaka_standard");

  useEffect(() => {
    let cancelled = false;
    const items = cart.map((i) => ({ productId: String(i.product.id), qty: i.qty }));
    fetchPricing(items, area).then((p) => {
      if (cancelled) return;
      setCashbackAmount(p.cashback);
      setCashbackTier(p.cashback >= 700 ? 2 : p.cashback >= 500 ? 1 : 0);
      setCashbackGap(p.nextTierAt ? p.nextTierAt - subtotal : 0);
      setBogoDiscount(p.bogoDiscount);
      setBogoFreeIndexes(p.bogoFreeIndexes || []);
      setDeliveryFees(p.deliveryFees);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [subtotal, area]);

  const getDeliveryFee = (a: DeliveryArea) => {
    switch (a) {
      case "outside": case "outside_standard": return deliveryFees.outsideDhaka;
      case "dhaka_express": return deliveryFees.express;
      case "store_pickup": return 0;
      default: return deliveryFees.insideDhaka;
    }
  };
  const calculateTotal = (a: DeliveryArea) => Math.max(0, subtotal - cashbackAmount - bogoDiscount) + getDeliveryFee(a);

  const setDeliveryArea = (a: DeliveryArea) => setArea(a);

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
        bogoDiscount,
        bogoFreeIndexes,
        getDeliveryFee,
        calculateTotal,
        setDeliveryArea,
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
