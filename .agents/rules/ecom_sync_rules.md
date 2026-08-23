# Cross_Ecom_Apps — Synchronization & Architectural Rules

## 1. WooCommerce Integration Rules
- **Store URL**: `https://deencommerce.com`
- **Consumer Keys**: Configured in `apps/api/.env` (`WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`).
- **Order Placement Requirements**:
  - Always pass `billing` and `shipping` objects containing `first_name`, `phone`, `address_1`, `city`, `state` (from the 64 Bangladesh districts, e.g. `BD-13`), `postcode`, and `country: "BD"`.
  - Always pass `shipping_lines` with the actual delivery charge (Dhaka Standard: ৳80, Outside Dhaka: ৳150, Store Pickup: ৳0).
  - Always pass `payment_method` (e.g. `cod`) and `payment_method_title` (`Cash on Delivery (COD)`).
  - For COD, `set_paid` MUST be `false` and order status should be `processing` or `on-hold`.
  - Metadata MUST include Pathao consignment ID (`pathao_consignment_id`), tracking URL (`pathao_tracking_url`), courier (`Pathao Courier`), and payment status.

## 2. Logistics & Courier Rules (Pathao)
- **Courier Provider**: Pathao Courier.
- **Consignment ID Format**: `PT-{order_seq}-{timestamp_suffix}`.
- **Tracking URL**: `https://merchant.pathao.com/tracking?consignment_id={consignment_id}`.
- **Customer UI**:
  - Web and Mobile must display the Pathao consignment ID and a direct "Track on Pathao" link/button in:
    1. Order Placement Confirmation / Success screen
    2. My Orders screen / Order Details
    3. Profile Tab / Recent Orders section

## 3. Delivery Fee & Areas
- **Dhaka Standard Delivery**: ৳80 (24–48 hours)
- **Outside Dhaka Delivery**: ৳150 (3–5 business days)
- **Store Pickup**: ৳0 (Banani Showroom)
- **Free Heavyweight Tee Promo**: Orders over ৳3,500 automatically receive a complimentary 240 GSM Tee (`GIFT-TEE` / `unit: 0`).

## 4. UI / UX & Dark Mode Rules
- **Theme Color Hierarchy**: Dark mode backgrounds MUST always use light/white typography (`#F4F6FC`, `#FFFFFF`, `#E2E8F0`) with high contrast. Never hardcode dark text on dark backgrounds.
- **Dynamic Styles**: React Native components must use `useTheme()` hook and dynamic styles rather than static `StyleSheet.create(Colors.*)` constants that do not adapt to theme changes.
- **All 64 BD Districts**: Both Web and Mobile checkout flows must provide an exhaustive list of all 64 Bangladesh districts for state selection.

## 5. Parity Across Web & Mobile
- **Endpoints**: Both Web (`apps/web`) and Mobile (`apps/mobile`) communicate with Gateway API (`apps/api`) at `/v1/deen/*`.
- **Sync**: Every feature added to the mobile app (checkout fields, Pathao tracking, order history, themes) must have an exact equivalent in the Next.js web application.
