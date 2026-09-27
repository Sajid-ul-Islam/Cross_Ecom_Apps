/**
 * Multilingual E-commerce Chatbot Types
 * Rule-based / deterministic dialog engine for WooCommerce.
 */

export type Lang = "bn" | "en" | "banglish";

export type BotState =
  | "IDLE"
  | "ORDER_PRODUCT"
  | "ORDER_SIZE"
  | "ORDER_QTY"
  | "ORDER_PHONE"
  | "ORDER_ADDRESS"
  | "ORDER_CONFIRM"
  | "STATUS_PHONE"
  | "STATUS_ORDERNO";

export type Intent =
  | "GREETING"
  | "PRODUCT_SEARCH"
  | "PLACE_ORDER"
  | "ORDER_STATUS"
  | "DELIVERY_INFO"
  | "EXCHANGE_POLICY"
  | "STORE_LOCATOR"
  | "OFFERS"
  | "SIZING_GUIDE"
  | "HUMAN_HANDOFF"
  | "UNKNOWN";

export interface IntentResult {
  intent: Intent;
  confidence: number;
  matched: string;
}

export interface ExtractedEntities {
  phone?: string;
  orderNumber?: string;
  size?: string;
  quantity?: number;
  price?: number;
  email?: string;
}

export interface ProductCard {
  id: number | string;
  name: string;
  price: number;
  regularPrice?: number;
  salePrice?: number;
  image: string;
  permalink?: string;
  in_stock: boolean;
  sizes?: string[];
  category?: string;
  sku?: string;
}

export interface SessionSlots {
  product?: ProductCard;
  productId?: string | number;
  productName?: string;
  size?: string;
  quantity?: number;
  phone?: string;
  address?: string;
  customerName?: string;
  orderNumber?: string;
  retryCount?: number;
  searchQuery?: string;
  [key: string]: any;
}

export interface ChatHistoryItem {
  role: "user" | "bot";
  text: string;
  ts: number;
  products?: ProductCard[];
  quickReplies?: string[];
}

export interface Session {
  id: string;
  lang: Lang;
  state: BotState;
  slots: SessionSlots;
  history: ChatHistoryItem[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionStore {
  get(id: string): Promise<Session | null> | Session | null;
  set(id: string, data: Session): Promise<void> | void;
  clear(id: string): Promise<void> | void;
}

export interface BotResponse {
  reply: string;
  products?: ProductCard[];
  quickReplies?: string[];
  state: BotState;
  actions?: Array<{ label: string; action: string; payload?: any }>;
}

export interface ChatRequestPayload {
  message: string;
  sessionId: string;
}
