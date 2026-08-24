import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationItem, BroadcastMessage, NotificationType } from "../types";
import { sendBroadcastAPI, fetchBroadcastsAPI, registerPushTokenAPI } from "../services/gateway";

const NOTIFICATIONS_STORAGE_KEY = "deen_mobile_notifications_v1";
const BROADCASTS_STORAGE_KEY = "deen_mobile_broadcasts_v1";
const PUSH_TOKEN_STORAGE_KEY = "deen_mobile_push_token_v1";

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_1",
    type: "PROMO",
    title: "🔥 Flash Sale: 20% OFF Raw Selvedge Denim",
    body: "Use promo code DEEN20 at checkout to claim 20% discount on all artisanal Japanese-grade rigid jeans.",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    read: false,
    promoCode: "DEEN20",
    actionUrl: "/category/JEANS",
    actionLabel: "Shop Selvedge Jeans",
    bannerImage: "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
  },
  {
    id: "notif_2",
    type: "ORDER",
    title: "📦 Parcel Dispatched: Order #DC-1041",
    body: "Your package containing 1x Heritage Raw Denim has been handed over to delivery agent. Expected arrival within 24-48h.",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    read: false,
    actionUrl: "/(tabs)/orders",
    actionLabel: "Track Order Status",
  },
  {
    id: "notif_3",
    type: "RESTOCK",
    title: "⚡ Restock Alert: Vintage Whisker Slim Jeans",
    body: "Back in stock in your favorite waist sizes (30, 32, 34). Crafted from 12 oz flex selvedge.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    actionUrl: "/product/dn-02",
    actionLabel: "View Product",
  },
  {
    id: "notif_5",
    type: "BROADCAST",
    title: "📣 Mirpur 12 Flagship Outlet Now Open for Pickups",
    body: "Select 'Store Pickup' at checkout to collect your orders free of charge from Ramzannesa Super Market, Mirpur 12.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    read: true,
    actionUrl: "/(tabs)/profile",
    actionLabel: "View Outlet Details",
  },
];

const INITIAL_BROADCASTS: BroadcastMessage[] = [
  {
    id: "bc_1",
    title: "🔥 Flash Sale: 20% OFF Raw Selvedge Denim",
    body: "Use promo code DEEN20 at checkout to claim 20% discount on all artisanal Japanese-grade rigid jeans.",
    type: "PROMO",
    audience: "ALL",
    promoCode: "DEEN20",
    actionUrl: "/category/JEANS",
    actionLabel: "Shop Selvedge Jeans",
    sentAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    sentBy: "Admin",
    recipientCount: 1420,
  },
  {
    id: "bc_2",
    title: "📣 Mirpur 12 Flagship Outlet Now Open for Pickups",
    body: "Select 'Store Pickup' at checkout to collect your orders free of charge from Ramzannesa Super Market, Mirpur 12.",
    type: "BROADCAST",
    audience: "DHAKA_ONLY",
    actionUrl: "/(tabs)/profile",
    actionLabel: "View Outlet Details",
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    sentBy: "Admin",
    recipientCount: 890,
  },
];

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
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(INITIAL_BROADCASTS);
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
        if (notifJson) {
          setNotifications(JSON.parse(notifJson));
        } else {
          await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
        }

        const bcJson = await AsyncStorage.getItem(BROADCASTS_STORAGE_KEY);
        if (bcJson) {
          setBroadcasts(JSON.parse(bcJson));
        } else {
          await AsyncStorage.setItem(BROADCASTS_STORAGE_KEY, JSON.stringify(INITIAL_BROADCASTS));
        }

        // Initialize push token and sync broadcasts
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
