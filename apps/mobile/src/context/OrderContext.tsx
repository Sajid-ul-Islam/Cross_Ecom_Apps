import React, { createContext, useContext, useEffect, useState } from "react";
import { Order } from "../types";
import { getOrders, createOrder as apiCreateOrder } from "../services/api";

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  placeOrder: (orderData: Omit<Order, "id" | "number" | "createdAt" | "status">) => Promise<Order>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOrders = async () => {
    setLoading(true);
    const list = await getOrders();
    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    refreshOrders();
  }, []);

  const placeOrder = async (orderData: Omit<Order, "id" | "number" | "createdAt" | "status">) => {
    const created = await apiCreateOrder(orderData);
    setOrders((prev) => [created, ...prev]);
    return created;
  };

  return (
    <OrderContext.Provider value={{ orders, loading, refreshOrders, placeOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};
