import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Track Orders | DEEN',
  robots: 'noindex, follow'
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
