# DEEN Commerce — Web Storefront (`apps/web`)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

**Full-fledged Next.js 14 E-commerce Web Storefront** for DEEN Commerce — Bangladesh's premier denim and dobby panjabi brand.

---

## 🌟 Key Features

- **SSR & Fast Edge Rendering**: Powered by Next.js 14 App Router for rapid page loads and high SEO rankings.
- **Full 64 Bangladesh Districts Checkout**: Integrated dropdown & modal selection supporting official WooCommerce BD state codes (`BD-13` Dhaka, `BD-10` Chattogram, etc.).
- **Dynamic Delivery Charge Engine**:
  - Inside Dhaka: **৳50**
  - Outside Dhaka (all 63 districts): **৳90**
  - Store Pickup: **৳0**
- **Live Pathao Logistics Tracking**: Orders with `ptc_consignment_id` render real-time clickable Pathao tracking buttons (`https://merchant.pathao.com/tracking?consignment_id=...`).
- **Cart & Wishlist State Management**: Client-side reactive cart, coupon discount applications, item count badges, and persistent storage.
- **Multiple Payment Gateways**: Cash on Delivery (COD), bKash, and Card payments (SSLCommerz).
- **Modern Responsive Design**: Editorial aesthetics tailored for raw selvedge denim, premium panjabis, and menswear collections.

---

## 📂 Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx             # Root layout with fonts, metadata, and cart provider
│   ├── page.tsx               # Homepage with hero slider, featured collections & craft highlights
│   ├── globals.css            # Custom CSS design system, dark/light variables & animations
│   ├── shop/                  # Product catalog with category, size & price filtering
│   ├── product/[id]/          # Detailed product view with sizing, stock check & image gallery
│   ├── cart/                  # Shopping bag summary, coupon validator & checkout trigger
│   ├── checkout/              # 64 BD districts form, payment selection & live order placement
│   ├── orders/                # Customer order tracking & status lookup
│   └── order-success/         # Order confirmation with invoice summary & Pathao tracking
├── components/                # Reusable UI widgets (Header, Footer, ProductCard, CartDrawer)
├── lib/
│   ├── api.ts                 # Gateway REST client connecting to apps/api
│   ├── cart.tsx               # React Context for shopping cart state
│   └── districts.ts           # 64 Bangladesh districts & delivery charge calculators
└── public/                    # Static brand assets, badges, and icons
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in `apps/web/`:

```env
# Gateway API URL
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8807
NEXT_PUBLIC_API_KEY=deen_secret_gateway_key_2026

# Site Metadata
NEXT_PUBLIC_SITE_NAME="DEEN Commerce"
NEXT_PUBLIC_SITE_URL="https://deencommerce.com"
```

---

## 💻 Local Development

```bash
# Navigate to web directory
cd apps/web

# Install dependencies
npm install

# Run Next.js development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` in your browser.

---

## 🚀 Deployment

The Next.js storefront is ready for zero-config deployment on **Vercel**:
- Root directory: `apps/web` (or root using `vercel.json`)
- Framework Preset: `Next.js`
- Set `NEXT_PUBLIC_GATEWAY_URL` and `NEXT_PUBLIC_API_KEY` in Vercel Environment Settings.
