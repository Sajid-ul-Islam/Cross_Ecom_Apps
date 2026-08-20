export type DeenCategory =
  | "ALL"
  | "JEANS"
  | "PANJABI"
  | "SHIRT"
  | "T-SHIRT"
  | "TROUSERS"
  | "POLO"
  | "ACCESSORIES";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: "JEANS" | "PANJABI" | "SHIRT" | "T-SHIRT" | "TROUSERS" | "POLO" | "ACCESSORIES";
  price: number;
  salePrice?: number;
  sizes: string[];
  images: [string, string];
  fabric: string;
  blurb: string;
  isNew?: boolean;
}

export interface CartItem {
  productId: string;
  product: Product;
  size: string;
  qty: number;
}

export type PaymentMethod = "cod" | "bkash" | "nagad";
export type DeliveryArea = "dhaka" | "outside";
export type OrderStatus = "received" | "confirmed" | "shipped" | "delivered";

export interface OrderItemLine {
  productId: string;
  name: string;
  sku: string;
  size: string;
  qty: number;
  unit: number;
  gift?: boolean;
}

export interface Order {
  id: string;
  number: string;
  name: string;
  phone: string;
  address: string;
  area: DeliveryArea;
  payment: PaymentMethod;
  lines: OrderItemLine[];
  subtotal: number;
  delivery: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  address: string;
  area: DeliveryArea;
  jeansSize: string;
  topSize: string;
  pushOrders: boolean;
  pushPromos: boolean;
}
