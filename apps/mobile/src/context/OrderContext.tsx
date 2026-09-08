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

  // Offline resilience (Q4 + S2 scalability scope): when connectivity returns,
  // re-submit orders created while offline so they reach WooCommerce. The
  // gateway's createOrder only writes a local `offline-*` order when it can't
  // reach Woo; re-calling it online pushes the real order and returns the
  // Woo-backed one. S2: per-order exponential backoff + jitter and a small
  // stagger between orders so a flaky reconnect doesn't spam the gateway;
  // the server dedupes resubmits by idempotencyKey (findWooOrderByKey).
  const syncOfflineOrders = async () => {
    const offline = ordersRef.current.filter((o) => String(o.id).startsWith("offline-"));
    if (offline.length === 0) return;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (const o of offline) {
      // Skip if this placeholder was already replaced while we worked.
      if (!ordersRef.current.some((x) => x.id === o.id)) continue;
      let attempt = 0;
      let synced: Order | null = null;
      while (attempt < 3 && !synced) {
        try {
          const res = await createOrder({
            name: o.name,
            phone: o.phone,
            address: o.address,
            area: o.area,
            payment: o.payment,
            email: o.email,
            lines: o.lines,
            idempotencyKey: o.idempotencyKey || `offline_${o.id}`,
          } as any);
          synced = res;
        } catch {
          attempt += 1;
          if (attempt < 3) {
            // 1s, 2s + jitter — stay offline-friendly, retry on next reconnect if still failing.
            await sleep(1000 * 2 ** (attempt - 1) + Math.random() * 250);
          }
        }
      }
      if (synced && !String(synced.id).startsWith("offline-")) {
        // Replace the local offline placeholder with the synced (Woo) order.
        setOrders((prev) => prev.map((x) => (x.id === o.id ? (synced as Order) : x)));
        await sleep(500 + Math.random() * 250); // stagger next resubmit
      }
      // else: stay offline; will retry on next reconnect
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
