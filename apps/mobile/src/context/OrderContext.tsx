import React, { createContext, useContext, useEffect, useState } from "react";
import { Order } from "../types";
import { getOrders, createOrder, getConnection, onConnectionChange } from "../services/gateway";

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  connection: "online" | "offline";
  refreshOrders: () => Promise<void>;
  placeOrder: (orderData: Omit<Order, "id" | "number" | "createdAt" | "status">) => Promise<Order>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<"online" | "offline">("online");
  const ordersRef = React.useRef<Order[]>([]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const refreshOrders = async () => {
    setLoading(true);
    const list = await getOrders();
    setOrders(list);
    setConnection(getConnection());
    setLoading(false);
  };

  // Offline resilience (Q4): when connectivity returns, re-submit any orders
  // that were created while offline so they reach WooCommerce. The gateway's
  // createOrder only writes a local `offline-*` order when it can't reach Woo;
  // re-calling it online pushes the real order and returns the Woo-backed one.
  const syncOfflineOrders = async () => {
    const offline = ordersRef.current.filter((o) => String(o.id).startsWith("offline-"));
    if (offline.length === 0) return;
    for (const o of offline) {
      try {
        const synced = await createOrder({
          name: o.name,
          phone: o.phone,
          address: o.address,
          area: o.area,
          payment: o.payment,
          email: o.email,
          lines: o.lines,
          idempotencyKey: o.idempotencyKey || `offline_${o.id}`,
        } as any);
        // Replace the local offline placeholder with the synced (Woo) order.
        if (!String(synced.id).startsWith("offline-")) {
          setOrders((prev) => prev.map((x) => (x.id === o.id ? synced : x)));
        }
      } catch {
        /* stay offline; will retry on next reconnect */
      }
    }
  };

  useEffect(() => {
    refreshOrders();
  }, []);

  useEffect(() => {
    return onConnectionChange((state) => {
      setConnection(state);
      if (state === "online") {
        void syncOfflineOrders().then(() => refreshOrders());
      }
    });
  }, []);

  const placeOrder = async (orderData: Omit<Order, "id" | "number" | "createdAt" | "status">) => {
    const created = await createOrder(orderData);
    setConnection(getConnection());
    setOrders((prev) => [created, ...prev]);
    return created;
  };

  return (
    <OrderContext.Provider value={{ orders, loading, connection, refreshOrders, placeOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};
