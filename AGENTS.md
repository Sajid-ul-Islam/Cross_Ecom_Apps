# Workspace Guidelines & E-commerce Rules

This codebase contains:
- `apps/api`: Fastify Gateway Server connected to WooCommerce (`https://deencommerce.com`)
- `apps/mobile`: Expo / React Native App (Android/iOS)
- `apps/web`: Next.js 14 App (Full-fledged E-commerce Web Frontend)

## Critical Operational Rules

1. **WooCommerce Order Placement**:
   - Order creation must always include `city`, `state` (from the 64 Bangladesh districts), `postcode`, and `country: "BD"` in both `billing` and `shipping`.
   - Include `shipping_lines` with delivery charge: `৳50` for Dhaka, `৳90` for Outside Dhaka, `৳0` for Store Pickup.
   - For COD (`cod`), `payment_method_title` is `Cash on Delivery (COD)` with `set_paid: false`.

2. **Pathao Logistics Tracking**:
   - Generate Pathao consignment ID `PT-{order_number}-{suffix}` and live tracking link `https://merchant.pathao.com/tracking?consignment_id=...`.
   - Display Pathao Consignment ID and clickable tracking link on:
     - Order Confirmation Screen (Web & Mobile)
     - My Orders Screen (Web & Mobile)
     - Profile Screen (Web & Mobile)

3. **District Selection**:
   - Both Web and Mobile checkout forms provide full 64 Bangladesh districts dropdown/modal selection with official WooCommerce state codes (`BD-13` Dhaka, `BD-10` Chattogram, etc.).

4. **UI/UX & Dark Mode**:
   - Dark mode backgrounds must always pair with bright, crisp, non-dark typography (`#F4F6FC`, `#FFFFFF`).
   - Use dynamic `useTheme()` tokens across all components.
