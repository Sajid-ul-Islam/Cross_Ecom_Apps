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

/** Standardized tracking milestone used across the app. */
export interface PathaoTrackingStep {
  /** ISO timestamp of the milestone event, or empty string if not yet reached. */
  timestamp: string;
  /** e.g. "waiting_for_pickup", "picked_up", "at_hub", "in_transit", "out_for_delivery", "delivered" */
  status: string;
  /** Human-readable label, e.g. "Picked Up", "In Transit to Hub". */
  label: string;
  /** Raw location/address text from Pathao, if available. */
  location?: string;
  /** true once Pathao has reported this step as complete. */
  completed: boolean;
  /** true for the step Pathao is currently on (not yet completed). */
  current: boolean;
}

/** Parsed live tracking info returned to app/web clients. */
export interface PathaoTrackingInfo {
  consignmentId: string;
  summary: string;
  status: string;
  steps: PathaoTrackingStep[];
  trackingUrl: string;
  lastUpdated: string;
}

/**
 * Pathao tracking status codes mapped from the Pathao API response.
 * The Pathao `/orders/{id}/info` endpoint returns a `shipment_details` or
 * `status` field that varies by plan; this function normalizes them.
 */
const PATHAO_STATUS_MAP: Record<string, { status: string; label: string; completed: boolean }> = {
  // Pathao uses various status strings; map them all to our normalized set
  pending: { status: "waiting_for_pickup", label: "Waiting for Pickup", completed: false },
  "waiting for pickup": { status: "waiting_for_pickup", label: "Waiting for Pickup", completed: false },
  "awaiting_pickup": { status: "waiting_for_pickup", label: "Awaiting Pickup", completed: false },
  picked_up: { status: "picked_up", label: "Picked Up", completed: true },
  "picked up": { status: "picked_up", label: "Picked Up", completed: true },
  "pickup_done": { status: "picked_up", label: "Picked Up", completed: true },
  at_hub: { status: "at_hub", label: "Reached Hub", completed: true },
  "at hub": { status: "at_hub", label: "Reached Hub", completed: true },
  in_hub: { status: "at_hub", label: "At Hub", completed: true },
  in_transit: { status: "in_transit", label: "In Transit", completed: true },
  "in transit": { status: "in_transit", label: "In Transit", completed: true },
  out_for_delivery: { status: "out_for_delivery", label: "Out for Delivery", completed: true },
  "out for delivery": { status: "out_for_delivery", label: "Out for Delivery", completed: true },
  delivered: { status: "delivered", label: "Delivered", completed: true },
  "delivered_to_recipient": { status: "delivered", label: "Delivered", completed: true },
  cancelled: { status: "cancelled", label: "Cancelled", completed: true },
  return_initiated: { status: "return_initiated", label: "Return Initiated", completed: true },
  return_completed: { status: "return_completed", label: "Return Completed", completed: true },
};

/** Ordered list of tracking statuses for building a progress timeline. */
const TRACKING_STEP_ORDER = [
  "waiting_for_pickup",
  "picked_up",
  "at_hub",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

/**
 * Fetch live parcel tracking information by Consignment ID (e.g. DD220826MDKMP9)
 * and parse the raw Pathao response into a normalized { steps, status } shape
 * that mobile and web can render in a timeline.
 */
export async function getPathaoTrackingInfo(consignmentId: string): Promise<PathaoTrackingInfo | null> {
  if (!consignmentId) return null;

  const raw: any = await pathaoRequest(`/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`);
  if (!raw) return null;

  // The Pathao info endpoint returns various shapes depending on the account
  // and API version. Key fields we care about:
  //  - raw.status or raw.tracking_status  : current consolidated status string
  //  - raw.shipment_details[]              : per-hop history with .status, .date/.timestamp, .location
  //  - raw.delivery_info / raw.tracking    : alternate containers
  const statusField = (raw.status || raw.tracking_status || raw.current_status || "") as string;
  const hops: any[] =
    raw.shipment_details ||
    raw.tracking ||
    raw.delivery_info ||
    raw.status_history ||
    [];

  const trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(consignmentId)}`;

  // Build normalized steps from the hop history
  const historySteps: PathaoTrackingStep[] = Array.isArray(hops)
    ? hops
        .map((h: any) => {
          const rawStatus = (h.status || h?.status_string || "").toString().toLowerCase().trim();
          const mapped = PATHAO_STATUS_MAP[rawStatus] || PATHAO_STATUS_MAP[rawStatus.replace(/_/g, " ")];
          if (!mapped) return null;
          const ts = (h.timestamp || h.date || h.created_at || h.updated_at || "") as string;
          const loc = h.location || h.hub_name || h.warehouse_name || undefined;
          return {
            timestamp: ts,
            status: mapped.status,
            label: mapped.label,
            ...(loc ? { location: loc } : {}),
            completed: mapped.completed,
            current: false,
          };
        })
        .filter((s): s is PathaoTrackingStep => s !== null)
    : [];

  // Determine the current live status from the API's consolidated field
  const currentMapped = PATHAO_STATUS_MAP[statusField.toLowerCase().trim()] ||
    PATHAO_STATUS_MAP[statusField.toLowerCase().replace(/_/g, " ")];

  const currentStatus = currentMapped?.status || statusField || "unknown";
  const summary = currentMapped?.label || statusField || "Tracking information being fetched…";

  // Determine which steps are completed vs current based on TRACKING_STEP_ORDER
  const orderedSteps: PathaoTrackingStep[] = TRACKING_STEP_ORDER.map((stepStatus) => {
    const fromHistory = historySteps.find((s) => s.status === stepStatus);
    if (fromHistory) {
      return { ...fromHistory, current: false };
    }
    // Not yet reached in history — mark as current if it's the next expected step
    const isCurrent = stepStatus === currentStatus && !historySteps.some((s) => s.status === stepStatus && s.completed);
    return {
      timestamp: "",
      status: stepStatus,
      label: PATHAO_STATUS_MAP[stepStatus]?.label || stepStatus.replace(/_/g, " "),
      completed: false,
      current: isCurrent,
    };
  });

  return {
    consignmentId,
    summary,
    status: currentStatus,
    steps: orderedSteps,
    trackingUrl,
    lastUpdated: raw.last_updated || raw.updated_at || raw.timestamp || new Date().toISOString(),
  };
}

/**
 * Cache wrapper around getPathaoTrackingInfo so the orders listing endpoint
 * doesn't hammer the Pathao API on every request. Results are cached per-
 * consignment ID for TRACKING_CACHE_MS.
 */
export interface CachedPathaoTracking {
  consignmentId: string;
  info: PathaoTrackingInfo | null;
  cachedAt: number;
}

const TRACKING_CACHE_MS = config.ttl.pathaoTrackingMs; // S1 env-overridable (default 1 min)
const trackingCache = new Map<string, CachedPathaoTracking>();

export function getCachedPathaoTracking(consignmentId: string): PathaoTrackingInfo | null {
  const cached = trackingCache.get(consignmentId);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > TRACKING_CACHE_MS) {
    trackingCache.delete(consignmentId);
    return null;
  }
  return cached.info;
}

export async function getFreshPathaoTracking(consignmentId: string): Promise<PathaoTrackingInfo | null> {
  const info = await getPathaoTrackingInfo(consignmentId);
  trackingCache.set(consignmentId, { consignmentId, info, cachedAt: Date.now() });
  return info;
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
