# Web Application Domain Rules (`apps/web`)

These rules apply to all web storefront development within `apps/web` (Next.js 15 App Router).

---

## 1. Strict Parity with Mobile App
- On mobile viewports (`< 768px`), the web app must **exactly mirror the native mobile app layout, hierarchy, and functionality**.
- Any feature added to the mobile app must have a simultaneous equivalent in `apps/web`.

## 2. Standard 5 Navigation Tabs
Both the mobile responsive view and the mobile native app declare the standard 5 tabs:
`[ 🏠 Home ]  [ 🗂️ Categories ]  [ 🛒 Cart (live badge) ]  [ 💬 Chat ]  [ 👤 Profile ]`
*(Note: Orders is placed within Profile and Order Success, NOT in the primary bottom tab bar).*

## 3. Dynamic Campaigns & Banner
- Actively fetch promotional state from `GET /v1/deen/campaigns`.
- Trigger top promotional banners (`🔥 FLAT UP TO 50% OFF`, BOGO indicators, and cashback tier trackers).

## 4. Checkout & BD Districts
- Checkout must provide the comprehensive 64 Bangladesh districts dropdown mapped to official WooCommerce state codes (e.g., `BD-13` for Dhaka, `BD-10` for Chattogram).
- Validate Bangladeshi 11-digit mobile phone numbers inline (`01XXXXXXXXX`).
- Shipping lines must accurately reflect the delivery tiers:
  - Dhaka Standard: `৳50`
  - Outside Dhaka: `৳90`
  - Store Pickup: `৳0`

## 5. Live Pathao Logistics Tracking
- Display real `pathaoConsignmentId` and clickable link to `https://merchant.pathao.com/tracking?consignment_id={consignment_id}` in Order Confirmation and Order History when assigned.
- Show "Preparing Dispatch" when consignment ID is not yet assigned.
