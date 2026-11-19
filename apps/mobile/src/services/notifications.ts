/**
 * DEEN Commerce Notification Service
 * Manages both Android Actual System Notification Drawer (status bar shade)
 * and In-App Notification Drawer (NotificationModal).
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Configure how notifications are displayed when app is foregrounded
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Configure Android Notification Channels for Android 8.0+ (API 26+)
 * High importance ensures notifications pop on screen and show in the Android Notification Drawer.
 */
export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync("deen_drops", {
      name: "New Product Drops & Arrivals",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F59E0B",
      sound: "default",
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("deen_orders", {
      name: "Order & Delivery Tracking",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: "#10B981",
      sound: "default",
      showBadge: true,
    });
  } catch (err) {
    console.warn("[Notifications] Failed to setup Android channels:", err);
  }
}

/**
 * Request notification permissions (required for Android 13+ POST_NOTIFICATIONS & iOS)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return true;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (err) {
    console.warn("[Notifications] Permission request error:", err);
    return false;
  }
}

/**
 * Push an actual system notification into the Android Notification Drawer
 */
export async function sendAndroidSystemNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  channelId: "deen_drops" | "deen_orders" = "deen_drops"
): Promise<string | null> {
  if (Platform.OS === "web") {
    // Web fallback notification if supported
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: "default",
        color: "#F59E0B",
        ...(Platform.OS === "android" ? { channelId } : {}),
      },
      trigger: null, // trigger immediately into Android Notification Drawer
    });
    return id;
  } catch (err) {
    console.warn("[Notifications] Error scheduling system notification:", err);
    return null;
  }
}

/**
 * Notify customer of a New Product Arrival / Drop
 * Shows both in the Android Actual Notification Drawer and provides data for In-App Drawer.
 */
export async function notifyNewProductDrop(
  productName: string,
  category: string,
  price: number,
  productId: string
): Promise<void> {
  const title = `✨ NEW DROP: ${productName}`;
  const body = `New artisanal ${category.toLowerCase()} now in stock for ৳${price.toLocaleString()}. Tap to inspect shuttle-loom craftsmanship!`;

  await sendAndroidSystemNotification(
    title,
    body,
    { productId, type: "NEW_DROP", url: `/product/${productId}` },
    "deen_drops"
  );
}

/**
 * Notify customer of Order Confirmation & Dispatch
 */
export async function notifyOrderConfirmed(orderNumber: string, total: number): Promise<void> {
  const title = `📦 ORDER CONFIRMED: #${orderNumber}`;
  const body = `Thank you! Your parcel of ৳${total.toLocaleString()} is queued for dispatch at our Dhaka hub.`;

  await sendAndroidSystemNotification(
    title,
    body,
    { orderNumber, type: "ORDER_STATUS", url: "/(tabs)/orders" },
    "deen_orders"
  );
}
