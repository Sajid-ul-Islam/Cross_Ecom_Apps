import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DynamicCampaignBanner from "@/components/DynamicCampaignBanner";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollToTop from "@/components/ScrollToTop";
import AiConciergeDrawer from "@/components/AiConciergeDrawer";

export const metadata: Metadata = {
  title: {
    default: "DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড",
    template: "%s | DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড",
  },
  icons: {
    icon: [
      { url: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-32x32.png",
    apple: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-180x180.png",
  },
  description:
    "Shop premium jeans, shirts, panjabis, and accessories. Authentic quality, delivered across Bangladesh.",
  keywords: ["DEEN", "deen commerce", "bangladesh fashion", "men jeans", "panjabi online", "premium shirts bangladesh"],
  openGraph: {
    type: "website",
    siteName: "DEEN Commerce",
    title: "DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড",
    description: "Premium jeans, shirts, panjabis & accessories. Delivered across Bangladesh.",
    images: ["https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-192x192.png"],
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
        <link rel="icon" href="https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-32x32.png" sizes="32x32" />
        <link rel="icon" href="https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-180x180.png" />
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
        {/* Google Analytics 4 (GA4) Tag for Vercel & Production Web */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-DEEN2026BD"}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-DEEN2026BD"}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body>
        <CartProvider>
          <WishlistProvider>
            <div className="site-header-wrapper">
              <DynamicCampaignBanner />
              <Header />
            </div>
            <main className="page-content">{children}</main>
            <Footer />
            <MobileBottomNav />
            <ScrollToTop />
            <AiConciergeDrawer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
