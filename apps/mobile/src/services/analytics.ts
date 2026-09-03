import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const GA_MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID || "G-DEEN2026BD";
const GA_API_SECRET = process.env.EXPO_PUBLIC_GA_API_SECRET || "";

const CLIENT_ID_KEY = "@deen_ga4_client_id";

/**
 * Retrieves or generates a persistent anonymous client UUID for GA4.
 */
async function getClientId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = "m_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      await AsyncStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon_" + Date.now();
  }
}

/**
 * Dispatches an event to Google Analytics 4 via Measurement Protocol.
 */
async function sendGa4Event(eventName: string, params: Record<string, any> = {}) {
  try {
    const clientId = await getClientId();
    const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}${
      GA_API_SECRET ? `&api_secret=${GA_API_SECRET}` : ""
    }`;

    const body = {
      client_id: clientId,
      events: [
        {
          name: eventName,
          params: {
            platform: Platform.OS,
            app_name: "DEEN Mobile",
            ...params,
          },
        },
      ],
    };

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {
      // Fire-and-forget in background without blocking UI
    });
  } catch {
    // Graceful silent fallback
  }
}

export const Analytics = {
  logScreenView: (screenName: string) => {
    sendGa4Event("screen_view", {
      screen_name: screenName,
      screen_class: screenName,
    });
  },

  logViewItem: (product: { id: string; name: string; price: number; category?: string }) => {
    sendGa4Event("view_item", {
      currency: "BDT",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category || "Apparel",
          price: product.price,
          quantity: 1,
        },
      ],
    });
  },

  logAddToCart: (item: { id: string; name: string; price: number; quantity?: number; size?: string }) => {
    sendGa4Event("add_to_cart", {
      currency: "BDT",
      value: item.price * (item.quantity || 1),
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          item_variant: item.size || "Standard",
        },
      ],
    });
  },

  logPurchase: (order: { id: string; total: number; deliveryFee?: number; paymentMethod?: string }) => {
    sendGa4Event("purchase", {
      transaction_id: order.id,
      currency: "BDT",
      value: order.total,
      shipping: order.deliveryFee || 0,
      payment_type: order.paymentMethod || "COD",
    });
  },
};
