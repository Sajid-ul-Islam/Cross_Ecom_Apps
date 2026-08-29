import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DynamicCampaignBanner from "@/components/DynamicCampaignBanner";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: {
    default: "DEEN Commerce — Premium Men's Fashion Bangladesh",
    template: "%s | DEEN Commerce",
  },
  description:
    "Shop premium jeans, shirts, panjabis, and accessories. Authentic quality, delivered across Bangladesh. Free T-shirt on orders over ৳3,500.",
  keywords: ["DEEN", "deen commerce", "bangladesh fashion", "men jeans", "panjabi online", "premium shirts bangladesh"],
  openGraph: {
    type: "website",
    siteName: "DEEN Commerce",
    title: "DEEN Commerce — Premium Men's Fashion Bangladesh",
    description: "Premium jeans, shirts, panjabis & accessories. Delivered across Bangladesh.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var saved = localStorage.getItem('deen_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var dark = saved ? saved === 'dark' : prefersDark;
                  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body>
        <CartProvider>
          <DynamicCampaignBanner />
          <Header />
          <main className="page-content">{children}</main>
          <Footer />
          <MobileBottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
