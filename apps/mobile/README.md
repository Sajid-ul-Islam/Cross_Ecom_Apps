<pre align="center">
  ██████╗  ███████╗ ███████╗ ███╗   ██╗     ██████╗  ██████╗  ███╗   ███╗ ███╗   ███╗ ███████╗ ██████╗   ██████╗ ███████╗
  ██╔══██╗ ██╔════╝ ██╔════╝ ████╗  ██║    ██╔════╝ ██╔═══██╗ ████╗ ████║ ████╗ ████║ ██╔════╝ ██╔══██╗ ██╔════╝ ██╔════╝
  ██║  ██║ █████╗   █████╗   ██╔██╗ ██║    ██║      ██║   ██║ ██╔████╔██║ ██╔████╔██║ █████╗   ██████╔╝ ██║      █████╗  
  ██║  ██║ ██╔══╝   ██╔══╝   ██║╚██╗██║    ██║      ██║   ██║ ██║╚██╔╝██║ ██║╚██╔╝██║ ██╔══╝   ██╔══██╗ ██║      ██╔══╝  
  ██████╔╝ ███████╗ ███████╗ ██║ ╚████║    ╚██████╗ ╚██████╔╝ ██║ ╚═╝ ██║ ██║ ╚═╝ ██║ ███████╗ ██║  ██║ ╚██████╗ ███████╗
  ╚═════╝  ╚══════╝ ╚══════╝ ╚═╝  ╚═══╝     ╚═════╝  ╚═════╝  ╚═╝     ╚═╝ ╚═╝     ╚═╝ ╚══════╝ ╚═╝  ╚═╝  ╚═════╝ ╚══════╝
                                    দেশের প্রথম ডেনিম ব্র্যান্ড · BANGLADESH'S FIRST DENIM BRAND
</pre>

<p align="center">
  <b>Artisanal Raw Selvedge Denim, Dobby Panjabis & Heavyweight Menswear Commerce Suite</b><br/>
  Cross-platform React Native (Expo SDK 55) Mobile App + Fastify WooCommerce Gateway + Web Storefront.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK_55-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 55" />
  <img src="https://img.shields.io/badge/React_Native-0.83-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/React-19.2-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Fastify-5.2-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/WooCommerce-Proxy_Gateway-96588A?style=for-the-badge&logo=woocommerce&logoColor=white" alt="WooCommerce" />
  <img src="https://img.shields.io/badge/Render-Deployed_API-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render" />
</p>

---

## 📑 Table of Contents

- [Project Overview](#project-overview)
- [Architecture & Monorepo Layout](#architecture--monorepo-layout)
- [🔑 Demo Test Accounts & Credentials](#-demo-test-accounts--credentials)
- [🎛️ 3-Way User Operating Modes](#️-3-way-user-operating-modes)
- [✨ What Has Been Done & Added](#-what-has-been-done--added)
  - [1. System-Inherited & User-Selectable Theme Engine](#1-system-inherited--user-selectable-theme-engine)
  - [2. Push Notifications & Admin Broadcast Marketing](#2-push-notifications--admin-broadcast-marketing)
  - [3. Customer Exchanges & Returns with Photo Uploads](#3-customer-exchanges--returns-with-photo-uploads)
  - [4. Dedicated Category Landing Pages & High-Res Covers](#4-dedicated-category-landing-pages--high-res-covers)
  - [5. Interactive Sizing & Fullscreen Image Lightbox](#5-interactive-sizing--fullscreen-image-lightbox)
  - [6. Wishlist & Price-Drop Watcher](#6-wishlist--price-drop-watcher)
  - [7. "Complete the Look" 3-Piece Outfit Builder](#7-complete-the-look-3-piece-outfit-builder)
  - [8. DEEN VIP Club Loyalty & Checkout Coins Redemption](#8-deen-vip-club-loyalty--checkout-coins-redemption)
  - [9. Daily Mystery Rewards & Streak Scratch Card](#9-daily-mystery-rewards--streak-scratch-card)
  - [10. Digital E-Gift Card Studio & WhatsApp Sharing](#10-digital-e-gift-card-studio--whatsapp-sharing)
  - [11. Live Courier GPS Tracking Simulator](#11-live-courier-gps-tracking-simulator)
  - [12. Physical Store Outlets Inventory Checker](#12-physical-store-outlets-inventory-checker)
  - [13. 1-Tap Master Tailor WhatsApp Concierge](#13-1-tap-master-tailor-whatsapp-concierge)
  - [14. Verified Customer Photo Reviews & Fit Profiler](#14-verified-customer-photo-reviews--fit-profiler)
  - [15. Artisanal Raw Denim Care & Fading Handbook](#15-artisanal-raw-denim-care--fading-handbook)
- [Gateway API Endpoints](#gateway-api-endpoints)
- [🚀 To-Do & Roadmap List](#-to-do--roadmap-list)
- [Quickstart & Running Locally](#quickstart--running-locally)

---

## Project Overview

**DEEN Commerce** is an omni-channel menswear e-commerce ecosystem built for Bangladesh's premier denim and dobby panjabi brand. It pairs a **high-performance React Native (Expo SDK 55) mobile application** with a **Fastify microservice gateway** hosted on Render (`https://cross-ecom-apps.onrender.com/`), backed by a web storefront desk.

The entire architecture is designed with **offline-first capability, real-time WooCommerce synchronization, and zero third-party peer dependency friction**.

---

## Architecture & Monorepo Layout

```
Cross_Ecom_Apps/
├── apps/
│   ├── mobile/                   # React Native (Expo SDK 55, React 19.2) mobile application
│   │   ├── app/                  # Expo Router file-based navigation
│   │   │   ├── (tabs)/           # Tab bar routes: Home (index), Shop, Bag, Orders, Profile
│   │   │   ├── category/[slug]   # Editorial category landing pages with craft banners
│   │   │   ├── product/[id]      # Detailed product screen with size chart & bundle builder
│   │   │   ├── checkout.tsx      # Secure checkout (Guest / Registered, coins discount, slots)
│   │   │   └── _layout.tsx       # Root provider hierarchy & crash handler
│   │   ├── src/
│   │   │   ├── components/       # Modals (Login, Broadcast, Returns, SizeGuide, Wishlist, etc.)
│   │   │   ├── context/          # Theme, Profile, Cart, Order, Wishlist, Rewards, Return, Notif
│   │   │   ├── data/             # Editorial categories & bundled 826-product catalog snapshot
│   │   │   ├── services/         # gateway.ts (Render REST API client) & api.ts (demo fallbacks)
│   │   │   ├── theme/            # Light & Dark color tokens (Japanese paper & midnight slate)
│   │   │   └── types/            # Complete TypeScript domain contracts
│   │   └── eas.json              # EAS build profiles (preview APK, production)
│   │
│   └── api/                      # Fastify REST Gateway (Node.js / TypeScript)
│       ├── src/
│       │   ├── routes.ts         # Endpoints: products, categories, stats, returns, broadcasts, auth
│       │   ├── woo.ts            # WooCommerce REST API proxy with 5-min catalog caching
│       │   ├── seed.ts           # Bundled catalog seed data
│       │   └── config.ts         # Render environment & secret loader
│       └── Dockerfile            # Production container deployment on Render
│
├── docs/                         # Comprehensive engineering blueprint & system guides
└── README.md                     # Root workspace documentation
```

---

## 🔑 Demo Test Accounts & Credentials

To enable rapid end-to-end testing of customer shopping, VIP loyalty, anonymous guest checkout, and store administrator analytics, 4 pre-configured test profiles are integrated:

| Role | Username / Email | BD Phone | Features & Access |
| :--- | :--- | :--- | :--- |
| 👤 **Regular Customer** | `customer`<br>*(or `tanvir@deen.com`)* | `01712-345678` | **Tanvir Ahmed**<br>• Saved address: *Uttara, Dhaka*<br>• Sizes: Jeans `32`, Top `L`<br>• 1,250 DEEN Coins |
| ⭐ **VIP Gold Shopper** | `vip`<br>*(or `vip@deen.com`)* | `01899-776655` | **Sajid-ul Islam (VIP)**<br>• Saved address: *Banani, Dhaka*<br>• Sizes: Jeans `34`, Top `XL`<br>• 4,800 DEEN Coins (Gold Tier) |
| 👑 **Store Admin & Merchant** | `admin`<br>*(or `admin@deen.com`)* | `01711-223344` | **DEEN Store Admin**<br>• **Live BI & Sales Analytics Dashboard** on Home<br>• **Push Broadcast Marketing Console**<br>• Full catalog & revenue access |
| ⚡ **Guest Mode** | `guest` | `01911-000000` | **Guest Shopper**<br>• Anonymous fast checkout without registration |

---

## 🎛️ 3-Way User Operating Modes

A persistent role switcher (`UserModeBar.tsx`) is rendered on the **Home feed** and **My Account screen** allowing 1-tap role toggling:

```
[ 👑 Admin Panel Mode ]    [ 👤 Registered User Mode ]    [ ⚡ Guest User Mode ]
```

1. **👑 Admin Panel Mode**: Unlocks the store's business intelligence dashboard on Home with sales sparklines, hourly conversion rates, revenue tiles, and marketing push broadcast dispatcher.
2. **👤 Registered User Mode**: Operates as an authenticated customer with saved addresses, order history, VIP streak rewards, and size preferences.
3. **⚡ Guest User Mode**: Simulates first-time shoppers who proceed through streamlined fast checkout without passwords or saved accounts.

---

## ✨ What Has Been Done & Added

### 1. System-Inherited & User-Selectable Theme Engine
- **OS Theme Auto-Inheritance**: Automatically follows iOS and Android dark/light mode via `useColorScheme()` (`app.json` configured with `"userInterfaceStyle": "automatic"`).
- **User Override**: In-app selector on the Profile screen offering `🌓 System Auto`, `☀️ Light Mode` (warm Japanese parchment `#F7F6F0`), and `🌙 Dark Mode` (midnight slate `#0D111A`).
- **Persistence**: Remembers preferences across sessions using `AsyncStorage` (`@deen_theme_mode_v1`).

### 2. Push Notifications & Admin Broadcast Marketing
- **In-App Notification Center (`NotificationModal.tsx`)**: Filterable inbox with `ALL`, `PROMOS`, `ORDERS`, and `RESTOCKS` tabs, unread badge counters, and 1-tap coupon copiers.
- **Admin Broadcast Console (`AdminBroadcastModal.tsx`)**: Allows store operators to compose marketing push announcements with audience targeting (*All Customers*, *VIP Members*, *Dhaka Shoppers*).
- **Backend Sync**: Supported by `GET /v1/deen/broadcasts` and `POST /v1/deen/broadcasts`.

### 3. Customer Exchanges & Returns with Photo Uploads
- **Hassle-Free Portal (`ReturnExchangeModal.tsx`)**: 1-tap exchange/return requests accessible directly from the **My Orders** screen.
- **Photo Evidence & Tailor Notes**: Multi-photo attachment selector with custom notes area for size alterations.
- **Live Status Tracking**: Step-by-step progress tracking cards with status badges (`PENDING_REVIEW`, `PICKUP_SCHEDULED`, `COMPLETED`).
- **Backend Sync**: Supported by `GET /v1/deen/returns` and `POST /v1/deen/returns`.

### 4. Dedicated Category Landing Pages & High-Res Covers
- **Collection Landings (`category/[slug].tsx`)**: Dedicated editorial pages for **Raw Selvedge Jeans**, **Festive Panjabis**, **Heavyweight Tees**, **Casual Shirts**, and **Trousers**.
- **Craft Highlights**: Displays fabric specs (*"13.5 oz Japanese-Grade Selvedge"*, *"Union Special Chainstitching"*), category filters, and live sorting.

### 5. Interactive Sizing & Fullscreen Image Lightbox
- **Size Guide Modal (`SizeGuideModal.tsx`)**: Unit toggle (**Inches / CM**) with measurement tables matching customer body profile.
- **Image Lightbox Modal (`ImageLightboxModal.tsx`)**: High-res pinch-and-zoom gallery carousel with thumbnail navigation.

### 6. Wishlist & Price-Drop Watcher
- **Saved Items Sheet (`WishlistModal.tsx`)**: Heart toggle on every product card with local storage persistence and automated price-drop notifications.
- **Bulk Action**: 1-tap **"MOVE ALL TO BAG"** button for quick checkout.

### 7. "Complete the Look" 3-Piece Outfit Builder
- **Outfit Bundling (`CompleteTheLook.tsx`)**: Automatically pairs complementary tops, pants, and layering pieces with a built-in **10% Bundle Discount**.

### 8. DEEN VIP Club Loyalty & Checkout Coins Redemption
- **Loyalty Store (`RewardsContext.tsx`)**: Point accrual on every order (**1 BDT = 1 Coin**, up to 2x tier bonus).
- **Checkout Redemption (`checkout.tsx`)**: 1-tap switch at checkout redeeming coins directly for cash discounts (2 Coins = ৳1 OFF).

### 9. Daily Mystery Rewards & Streak Scratch Card
- **Gamified Daily Check-In (`DailyRewardsModal.tsx`)**: 7-day streak tracker with tap-to-scratch mystery vouchers (discount codes, free shipping, bonus coins).

### 10. Digital E-Gift Card Studio & WhatsApp Sharing
- **E-Gift Cards (`GiftCardModal.tsx`)**: Themed greeting cards (*Eid Festive*, *Raw Selvedge*, *VIP Gold*) with instant voucher code generation and 1-tap WhatsApp sharing.

### 11. Live Courier GPS Tracking Simulator
- **Courier Visualizer (`CourierTrackingModal.tsx`)**: Route simulation from the Tejgaon Hub with live milestones and direct 1-tap rider phone calling.

### 12. Physical Store Outlets Inventory Checker
- **Stock Checker (`StoreStockModal.tsx`)**: Real-time stock counts for the **Banani Flagship Studio** and **Mirpur 12 Outlet** with Google Maps directions.

### 13. 1-Tap Master Tailor WhatsApp Concierge
- **WhatsApp Concierge (`WhatsAppConciergeButton.tsx`)**: Floating button connecting shoppers directly to DEEN master tailors in Dhaka for size and custom hemming consultations.

### 14. Verified Customer Photo Reviews & Fit Profiler
- **Photo Reviews (`ProductReviewsModal.tsx`)**: Verified buyer ratings, uploaded fit photos, and body profile stats (Height & Weight) with an interactive review submission form.

### 15. Artisanal Raw Denim Care & Fading Handbook
- **Care Handbook (`DenimCareGuideModal.tsx`)**: Illustrated guide covering cold soaking, break-in fading patterns (whiskers/honeycombs), and chainstitch hemming.

---

## Gateway API Endpoints

The Fastify gateway is live at `https://cross-ecom-apps.onrender.com/`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/v1/health` | Gateway health check & WooCommerce connection state |
| `GET` | `/v1/deen/products` | Catalog search, category filters, and sorting |
| `GET` | `/v1/deen/products/:id` | Single product details with live WooCommerce variations |
| `GET` | `/v1/deen/categories` | Catalog category list and item counts |
| `GET` | `/v1/deen/stats` | Store analytics, sales sparklines & KPI tiles (**Admin**) |
| `GET` | `/v1/deen/snapshot` | 826-product catalog JSON snapshot for offline caching |
| `POST` | `/v1/deen/orders` | Create order with delivery slot & items |
| `GET` | `/v1/deen/orders` | Order lookup by phone or order number |
| `POST` | `/v1/deen/broadcasts` | Dispatch marketing push broadcast (**Admin**) |
| `GET` | `/v1/deen/broadcasts` | List past broadcast history |
| `POST` | `/v1/deen/returns` | Submit return / size exchange ticket with photos |
| `GET` | `/v1/deen/returns` | Retrieve exchange / return tickets by phone or order |
| `GET` | `/v1/auth/demo-accounts` | List pre-configured demo test credentials |
| `POST` | `/v1/auth/login` | Authenticate customer, VIP, or admin user |
| `POST` | `/v1/deen/bugs` | In-app bug and crash reporting sink |

---

## 🚀 To-Do & Roadmap List

### ✅ Completed Features
- [x] Full responsive mobile experience on React Native / Expo SDK 55.
- [x] Replaced peer-incompatible icon libraries with zero-dependency inline SVG icon set (`Icons.tsx`).
- [x] Live WooCommerce proxy gateway deployed on Render (`https://cross-ecom-apps.onrender.com/`).
- [x] Offline-first catalog snapshot (826 live items bundled for instant boot).
- [x] Store Administrator BI & Sales Analytics Dashboard on Home.
- [x] Push Notification Tray & Store Admin Broadcast Marketing Console.
- [x] Customer Returns & Size Exchanges with photo upload and live ticket status.
- [x] Category landing pages with high-resolution editorial covers.
- [x] Product detail size guide modal (Inch/CM toggle) and fullscreen zoomable lightbox.
- [x] Wishlist & price-drop watchlist with 1-tap bulk add-to-bag.
- [x] "Complete the Look" 3-piece outfit bundle builder with 10% discount.
- [x] DEEN VIP Club Loyalty coins & checkout redemption toggle.
- [x] Daily mystery scratch card with streak multipliers.
- [x] Digital E-Gift Card Studio with WhatsApp sharing.
- [x] Live courier GPS parcel tracking simulator with rider calling.
- [x] Physical outlet stock availability checker (Banani & Mirpur).
- [x] WhatsApp master tailor styling concierge.
- [x] Customer photo reviews and fit profiler.
- [x] Raw selvedge denim care & fading handbook.
- [x] System-inherited and user-selectable Light & Dark Theme engine.
- [x] 3-Way User Mode Switcher (Admin Panel Mode ↔ Registered User ↔ Guest User).
- [x] Pre-configured demo test accounts with usernames, passwords, and phone numbers.

### 🔮 Future Milestones & Enhancements
- [ ] Connect production Expo Push Notification server (`expo-server-sdk`) for OS-level background notifications.
- [ ] Connect production bKash & Nagad merchant gateway tokens for direct mobile payment callbacks.
- [ ] Attach persistent SQLite / PostgreSQL database for persistent bug ticket archival.
- [ ] Add live barcode/QR code scanner for in-store outlet pickup verification.

---

## Quickstart & Running Locally

### 1. Prerequisites
- **Node.js**: v20.x recommended.
- **Package Manager**: `npm`.

### 2. Running the Mobile App
```bash
# Navigate to mobile app directory
cd apps/mobile

# Install dependencies
npm install

# Run TypeScript check
npm run typecheck

# Start Expo dev server
npm start
```

### 3. Running the Gateway API Locally
```bash
# Navigate to gateway API directory
cd apps/api

# Install dependencies
npm install

# Run TypeScript check
npm run typecheck

# Start local server (Default port: 4000)
npm run dev
```

### 4. Running the Web Storefront Desk
```bash
# In the workspace root
npm install
npm run dev
```

---

<p align="center">
  <sub>Crafted with passion for DEEN Commerce · Dhaka, Bangladesh</sub>
</p>
