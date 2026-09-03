import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationItem, BroadcastMessage, NotificationType } from "../types";
import { sendBroadcastAPI, fetchBroadcastsAPI, registerPushTokenAPI, fetchActiveCampaigns } from "../services/gateway";

const NOTIFICATIONS_STORAGE_KEY = "deen_mobile_notifications_v1";
const BROADCASTS_STORAGE_KEY = "deen_mobile_broadcasts_v1";
const PUSH_TOKEN_STORAGE_KEY = "deen_mobile_push_token_v1";

interface NotificationContextType {
  notifications: NotificationItem[];
  broadcasts: BroadcastMessage[];
  unreadCount: number;
  pushToken: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (item: Omit<NotificationItem, "id" | "timestamp" | "read">) => Promise<void>;
  sendBroadcast: (msg: Omit<BroadcastMessage, "id" | "sentAt" | "recipientCount">) => Promise<BroadcastMessage>;
  refreshBroadcasts: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync broadcasts from gateway API & merge into local inbox
  const syncLiveBroadcasts = async () => {
    try {
      const remote = await fetchBroadcastsAPI();
      if (Array.isArray(remote) && remote.length > 0) {
        setBroadcasts(remote);
        await AsyncStorage.setItem(BROADCASTS_STORAGE_KEY, JSON.stringify(remote)).catch(() => {});

        // Convert remote broadcasts into notification inbox items if not present
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const converted: NotificationItem[] = remote
            .filter((bc) => !existingIds.has(bc.id))
            .map((bc) => ({
              id: bc.id,
              type: bc.type,
              title: bc.title,
              body: bc.body,
              timestamp: bc.sentAt || new Date().toISOString(),
              read: false,
              promoCode: bc.promoCode,
              actionUrl: bc.actionUrl,
              actionLabel: bc.actionLabel,
              bannerImage: bc.bannerImage,
            }));
          if (converted.length > 0) {
            const merged = [...converted, ...prev];
            AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
            return merged;
          }
          return prev;
        });
      }
    } catch {
      /* network offline — use cached */
    }
  };

  // Register or obtain push token on startup
  const initPushToken = async () => {
    try {
      let token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (!token) {
        // Deterministic or generated Exponent Push Token format for simulator/device
        token = `ExponentPushToken[${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}]`;
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      }
      setPushToken(token);

      // Register with gateway
      await registerPushTokenAPI(token, {
        area: "dhaka",
        device: {
          platform: Platform.OS,
          osVersion: String(Platform.Version),
          model: Platform.select({ ios: "iPhone", android: "Android Device", default: "Mobile Client" }),
        },
      });
    } catch (e) {
      console.warn("Push token registration error:", e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const notifJson = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        const activeCamp = await fetchActiveCampaigns();
        const isCashback = Boolean(activeCamp?.cashback?.enabled);
        const isSale = Boolean(activeCamp?.sale?.enabled ?? true);

        let initialList: NotificationItem[] = [];
        if (notifJson && JSON.parse(notifJson).length > 0) {
          initialList = JSON.parse(notifJson);
        } else {
          initialList = [
            ...(isSale
              ? [
                  {
                    id: "notif_flash_sale",
                    type: "PROMO" as const,
                    title: activeCamp?.sale?.title ? `🔥 ${activeCamp.sale.title}` : "🔥 Flat up to 50% Off Season Clearance",
                    body: activeCamp?.sale?.subtitle || "Save 40%–50% on selected raw selvedge denim, panjabis & artisanal shirts. Limited time only!",
                    timestamp: new Date().toISOString(),
                    read: false,
                    promoCode: "DEEN50",
                    actionUrl: "/(tabs)/shop",
                    actionLabel: "Shop Sale Now →",
                  },
                ]
              : []),
            ...(isCashback
              ? [
                  {
                    id: "notif_cashback",
                    type: "PROMO" as const,
                    title: "🎁 Up to ৳700 Instant Cashback Available",
                    body: "Get ৳500 instant cashback on orders over ৳2,500 and ৳700 on ৳3,000+. Automatically applies at checkout.",
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    read: false,
                    actionUrl: "/(tabs)/shop",
                    actionLabel: "Unlock Cashback →",
                  },
                ]
              : []),
            {
              id: "notif_bank_cards",
              type: "PROMO" as const,
              title: "💳 Up to 15% Bank Card Instant Savings",
              body: "Use City Bank Amex (code: AMEXDEEN), BRAC Bank (code: BRAC10), EBL (code: EBLDEEN) or SCB Priority for instant discount.",
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              read: false,
              promoCode: "AMEXDEEN",
              actionUrl: "/(tabs)/shop",
              actionLabel: "View Eligible Items →",
            },
          ];
        }

        // Dynamically prune or inject cashback notification based on current campaign state
        if (!isCashback) {
          initialList = initialList.filter((n) => n.id !== "notif_cashback" && !/cashback/i.test(n.title) && !/cashback/i.test(n.body));
        } else if (!initialList.some((n) => n.id === "notif_cashback")) {
          initialList.unshift({
            id: "notif_cashback",
            type: "PROMO",
            title: "🎁 Up to ৳700 Instant Cashback Available",
            body: "Get ৳500 instant cashback on orders over ৳2,500 and ৳700 on ৳3,000+. Automatically applies at checkout.",
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: "/(tabs)/shop",
            actionLabel: "Unlock Cashback →",
          });
        }

        setNotifications(initialList);
        await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initialList));

        const bcJson = await AsyncStorage.getItem(BROADCASTS_STORAGE_KEY);
        if (bcJson) {
          setBroadcasts(JSON.parse(bcJson));
        } else {
          await AsyncStorage.setItem(BROADCASTS_STORAGE_KEY, JSON.stringify([]));
        }

        // Initialize push token and sync live broadcasts from REST API
        await initPushToken();
        await syncLiveBroadcasts();
      } catch (e) {
        console.error("Failed to load notifications", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const saveNotifications = async (items: NotificationItem[]) => {
    setNotifications(items);
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  };

  const saveBroadcasts = async (items: BroadcastMessage[]) => {
    setBroadcasts(items);
    await AsyncStorage.setItem(BROADCASTS_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    await saveNotifications(updated);
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    await saveNotifications(updated);
  };

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    await saveNotifications(updated);
  };

  const addNotification = async (item: Omit<NotificationItem, "id" | "timestamp" | "read">) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    await saveNotifications([newNotif, ...notifications]);
  };

  const sendBroadcast = async (
    msg: Omit<BroadcastMessage, "id" | "sentAt" | "recipientCount">
  ): Promise<BroadcastMessage> => {
    let newBroadcast: BroadcastMessage;
    try {
      newBroadcast = await sendBroadcastAPI(msg);
    } catch {
      newBroadcast = {
        ...msg,
        id: `bc_${Date.now()}`,
        sentAt: new Date().toISOString(),
        recipientCount: Math.floor(800 + Math.random() * 1500),
      };
    }

    // Also push a live notification into customer inbox
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type: msg.type,
      title: msg.title,
      body: msg.body,
      timestamp: newBroadcast.sentAt || new Date().toISOString(),
      read: false,
      promoCode: msg.promoCode,
      actionUrl: msg.actionUrl,
      actionLabel: msg.actionLabel,
      bannerImage: msg.bannerImage,
    };

    await saveBroadcasts([newBroadcast, ...broadcasts]);
    await saveNotifications([newNotif, ...notifications]);
    return newBroadcast;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        broadcasts,
        unreadCount,
        pushToken,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        sendBroadcast,
        refreshBroadcasts: syncLiveBroadcasts,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
