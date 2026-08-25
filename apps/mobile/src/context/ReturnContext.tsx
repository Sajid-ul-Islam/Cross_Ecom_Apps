import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReturnExchangeRequest, ReturnType } from "../types";
import { useNotifications } from "./NotificationContext";
import { request } from "../services/gateway";

const RETURNS_STORAGE_KEY = "deen_mobile_returns_v1";

const INITIAL_RETURNS: ReturnExchangeRequest[] = [];

interface ReturnContextType {
  returns: ReturnExchangeRequest[];
  getReturnForOrder: (orderIdOrNumber: string) => ReturnExchangeRequest | undefined;
  createReturnRequest: (
    req: Omit<ReturnExchangeRequest, "id" | "ticketNumber" | "status" | "createdAt" | "updatedAt">
  ) => Promise<ReturnExchangeRequest>;
  cancelReturnRequest: (id: string) => Promise<void>;
  loading: boolean;
}

const ReturnContext = createContext<ReturnContextType | undefined>(undefined);

export const ReturnProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [returns, setReturns] = useState<ReturnExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(RETURNS_STORAGE_KEY);
        if (json) {
          setReturns(JSON.parse(json));
        }
      } catch (e) {
        console.error("Failed to load return requests", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveReturns = async (list: ReturnExchangeRequest[]) => {
    setReturns(list);
    await AsyncStorage.setItem(RETURNS_STORAGE_KEY, JSON.stringify(list)).catch(() => {});
  };

  const getReturnForOrder = (orderIdOrNumber: string) => {
    return returns.find(
      (r) => r.orderId === orderIdOrNumber || r.orderNumber === orderIdOrNumber
    );
  };

  const createReturnRequest = async (
    req: Omit<ReturnExchangeRequest, "id" | "ticketNumber" | "status" | "createdAt" | "updatedAt">
  ): Promise<ReturnExchangeRequest> => {
    const prefix = req.type === "EXCHANGE" ? "EXC" : "RET";
    const rand = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `${prefix}-${rand}`;
    const now = new Date().toISOString();

    const newTicket: ReturnExchangeRequest = {
      ...req,
      id: `ticket_${Date.now()}`,
      ticketNumber,
      status: "PENDING_REVIEW",
      createdAt: now,
      updatedAt: now,
    };

    // Try posting to gateway API (best effort)
    try {
      await request("/v1/deen/returns", {
        method: "POST",
        body: JSON.stringify(newTicket),
      });
    } catch {}

    const updated = [newTicket, ...returns];
    await saveReturns(updated);

    // Send confirmation in-app notification
    await addNotification({
      type: "ORDER",
      title: `🔄 ${req.type === "EXCHANGE" ? "Exchange" : "Return"} Request #${ticketNumber} Submitted`,
      body: `Your request for order ${req.orderNumber} has been received. Our team will verify photos & arrange courier pickup within 24 hours.`,
      actionUrl: "/(tabs)/orders",
      actionLabel: "View Return Status",
    });

    return newTicket;
  };

  const cancelReturnRequest = async (id: string) => {
    const updated = returns.filter((r) => r.id !== id);
    await saveReturns(updated);
  };

  return (
    <ReturnContext.Provider
      value={{
        returns,
        getReturnForOrder,
        createReturnRequest,
        cancelReturnRequest,
        loading,
      }}
    >
      {children}
    </ReturnContext.Provider>
  );
};

export const useReturns = () => {
  const ctx = useContext(ReturnContext);
  if (!ctx) throw new Error("useReturns must be used within ReturnProvider");
  return ctx;
};
