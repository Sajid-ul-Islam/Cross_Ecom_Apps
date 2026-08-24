export type DeenCategory =
  | "ALL"
  | "JEANS"
  | "PANJABI"
  | "SHIRT"
  | "T-SHIRT"
  | "TROUSERS"
  | "POLO"
  | "ACCESSORIES"
  | "OTHER";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: "JEANS" | "PANJABI" | "SHIRT" | "T-SHIRT" | "TROUSERS" | "POLO" | "ACCESSORIES" | "OTHER";
  price: number;
  salePrice?: number;
  regularPrice?: number;
  salePct?: number;
  sizes: string[];
  images: [string, string];
  gallery: string[];
  fabric: string;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  rating: number;
  ratingCount: number;
  blurb: string;
  isNew?: boolean;
  fit?: string; // jeans fit from Woo (Regular | Slim | Straight)
  variations?: Variation[];
}

export interface Variation {
  id: number;
  size: string;
  stock: string;
  price: number;
  regular: number;
}

export interface Stats {
  mode: "live" | "seed";
  store: {
    totalProducts: number;
    onSale: number;
    outOfStock: number;
    avgPrice: number;
  };
  sales: {
    period: string;
    totalSales: number;
    netSales: number;
    orders: number;
    items: number;
    newCustomers: number;
    shipping: number;
    series: { date: string; sales: number; orders: number; customers: number }[];
  };
  categories: { category: string; count: number }[];
  topSellers: { productId: number; name: string; itemsSold: number; revenue: number }[];
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  size: string;
  qty: number;
  variationId?: number;
}

export type PaymentMethod = "cod" | "bkash" | "nagad" | "manual";

export type DeliveryOptionKey =
  | "dhaka_standard"
  | "dhaka_express"
  | "outside_standard"
  | "store_pickup";

export type DeliveryArea = "dhaka" | "outside" | DeliveryOptionKey;

export type DeliverySlot = "any" | "morning" | "afternoon" | "evening";

export interface DeliveryOption {
  id: DeliveryOptionKey;
  name: string;
  sub: string;
  fee: number;
  estimatedDays: string;
  badge?: string;
  icon?: string;
}

export type OrderStatus = "received" | "confirmed" | "shipped" | "delivered";

export interface OrderItemLine {
  productId: string;
  name: string;
  sku: string;
  size: string;
  qty: number;
  unit: number;
  gift?: boolean;
  variationId?: number;
}

export interface Order {
  id: string;
  number: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  area: DeliveryArea;
  deliveryOption?: DeliveryOptionKey;
  deliverySlot?: DeliverySlot;
  deliveryNotes?: string;
  payment: PaymentMethod;
  paymentTitle?: string;
  paymentStatus?: string;
  trxId?: string; // bKash/Nagad manual transfer transaction ID (manual payment)
  lines: OrderItemLine[];
  subtotal: number;
  delivery: number;
  total: number;
  status: OrderStatus;
  courier?: string;
  pathaoConsignmentId?: string;
  pathaoTrackingUrl?: string;
  wooId?: number;
  wooNumber?: string; // REAL WooCommerce order number (e.g. "1042") shown to customer
  isGuestOrder?: boolean;
  /** Gateway-issued anonymous guest session token (when placed as a guest). */
  guestToken?: string;
  createdAt: string;
}


export type AccountType = "guest" | "customer" | "admin";

export interface SavedAddress {
  id: string;
  label: string; // e.g. "Home", "Office"
  address: string;
  area: DeliveryOptionKey;
  isDefault?: boolean;
}

export interface UserProfile {
  accountType: AccountType;
  isGuest: boolean;
  username?: string;
  role: "customer" | "admin";
  name: string;
  phone: string;
  email?: string;
  address: string;
  area: DeliveryOptionKey;
  deliverySlot?: DeliverySlot;
  deliveryNotes?: string;
  jeansSize: string;
  topSize: string;
  pushOrders: boolean;
  pushPromos: boolean;
  memberSince?: string;
  savedAddresses?: SavedAddress[];
}

export type NotificationType = "PROMO" | "ORDER" | "RESTOCK" | "BROADCAST" | "SYSTEM";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  promoCode?: string;
  actionUrl?: string; // e.g. "/category/JEANS" or "/product/dn-01" or "/(tabs)/orders"
  actionLabel?: string;
  bannerImage?: string;
}

export type BroadcastAudience = "ALL" | "REGISTERED" | "GUEST" | "DHAKA_ONLY";

export interface BroadcastMessage {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  audience: BroadcastAudience;
  promoCode?: string;
  actionUrl?: string;
  actionLabel?: string;
  bannerImage?: string;
  sentAt: string;
  sentBy?: string;
  recipientCount?: number;
}

export type ReturnType = "EXCHANGE" | "RETURN";

export type ReturnReason =
  | "SIZE_FIT_TOO_TIGHT"
  | "SIZE_FIT_TOO_LOOSE"
  | "FABRIC_DEFECT"
  | "STITCHING_ISSUE"
  | "WRONG_ITEM_SENT"
  | "CHANGED_MIND"
  | "TRANSIT_DAMAGE";

export type ReturnStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "PICKUP_SCHEDULED"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "REJECTED";

export interface ReturnExchangeItem {
  productId: string;
  name: string;
  sku: string;
  currentSize: string;
  desiredSize?: string;
  qty: number;
  unit: number;
}

export interface ReturnExchangeRequest {
  id: string; // e.g. "RET-8492" or "EXC-1049"
  ticketNumber: string;
  orderId: string;
  orderNumber: string;
  type: ReturnType;
  reason: ReturnReason;
  reasonText: string;
  customerNotes: string;
  images: string[]; // URLs or base64 data URIs
  items: ReturnExchangeItem[];
  pickupMethod: "courier_pickup" | "studio_dropoff";
  pickupAddress: string;
  contactPhone: string;
  customerName: string;
  refundMethod?: "bkash" | "nagad" | "bank" | "store_credit";
  refundAccount?: string;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
}


