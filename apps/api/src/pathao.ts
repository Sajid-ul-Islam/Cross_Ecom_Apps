import { config, pathaoEnabled } from "./config.js";

interface PathaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Acquire or reuse Pathao Bearer token from /aladdin/api/v1/issue-token.
 */
export async function getPathaoToken(): Promise<string | null> {
  if (!pathaoEnabled) {
    return null;
  }

  // Reuse if still valid (with 60s safety buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const { baseUrl, clientId, clientSecret, username, password } = config.pathao;
  const tokenUrl = `${baseUrl.replace(/\/+$/, "")}/aladdin/api/v1/issue-token`;

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        username,
        password,
        grant_type: "password",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[pathao] Token issue failed HTTP ${res.status}:`, errText);
      return null;
    }

    const data = (await res.json()) as PathaoTokenResponse;
    if (data.access_token) {
      cachedAccessToken = data.access_token;
      tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
      console.log(`[pathao] Token acquired successfully (valid for ${data.expires_in}s).`);
      return cachedAccessToken;
    }
  } catch (err) {
    console.error("[pathao] Error issuing Pathao token:", (err as Error).message);
  }

  return null;
}

/**
 * Generic authenticated request helper for Pathao API endpoints.
 */
async function pathaoRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const token = await getPathaoToken();
  if (!token) {
    return null;
  }

  const { baseUrl } = config.pathao;
  const url = `${baseUrl.replace(/\/+$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[pathao] API call ${endpoint} failed HTTP ${res.status}:`, errText);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[pathao] API request exception on ${endpoint}:`, (err as Error).message);
    return null;
  }
}

/**
 * Fetch live parcel tracking information and delivery history by Consignment ID (e.g. DD220826MDKMP9).
 */
export async function getPathaoTrackingInfo(consignmentId: string): Promise<any | null> {
  if (!consignmentId) return null;
  return pathaoRequest(`/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`);
}

/**
 * Fetch merchant stores registered under this Pathao account.
 */
export async function getPathaoStores(): Promise<any | null> {
  return pathaoRequest("/aladdin/api/v1/stores");
}

/**
 * Fetch available delivery cities in Bangladesh.
 */
export async function getPathaoCities(): Promise<any | null> {
  return pathaoRequest("/aladdin/api/v1/countries/1/city-list");
}

/**
 * Fetch delivery zones within a city.
 */
export async function getPathaoZones(cityId: number | string): Promise<any | null> {
  return pathaoRequest(`/aladdin/api/v1/cities/${cityId}/zone-list`);
}

/**
 * Fetch delivery areas within a zone.
 */
export async function getPathaoAreas(zoneId: number | string): Promise<any | null> {
  return pathaoRequest(`/aladdin/api/v1/zones/${zoneId}/area-list`);
}

/**
 * Create/book a parcel order in Pathao Courier.
 */
export async function createPathaoOrder(params: {
  storeId: number | string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: number | string;
  recipientZone: number | string;
  recipientArea?: number | string;
  deliveryType?: 48 | 12; // 48: Normal, 12: On Demand
  itemType?: 1 | 2; // 1: Document, 2: Parcel
  itemQuantity?: number;
  itemWeight?: number; // In KG (0.5 to 10)
  amountToCollect: number; // COD amount
  itemDescription?: string;
  merchantOrderId?: string;
}): Promise<any | null> {
  return pathaoRequest("/aladdin/api/v1/orders", {
    method: "POST",
    body: JSON.stringify({
      store_id: params.storeId,
      merchant_order_id: params.merchantOrderId,
      recipient_name: params.recipientName,
      recipient_phone: params.recipientPhone,
      recipient_address: params.recipientAddress,
      recipient_city: params.recipientCity,
      recipient_zone: params.recipientZone,
      recipient_area: params.recipientArea,
      delivery_type: params.deliveryType || 48,
      item_type: params.itemType || 2,
      special_instruction: "Fragile fashion apparel · Handle with care",
      item_quantity: params.itemQuantity || 1,
      item_weight: params.itemWeight || 0.5,
      amount_to_collect: params.amountToCollect,
      item_description: params.itemDescription || "DEEN Commerce Order",
    }),
  });
}
