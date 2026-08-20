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
  variationId?: number;
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
