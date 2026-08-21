<pre align="center">
▄▄▄▄  ▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄  ▄▄▄▄      ▄▄▄▄  ▄▄▄▄ ▄  ▄ ▄▄▄▄▄
█▄▄▀ ▄▄▄█   █   ▄▄▄█ █▄▄▀      █▄▄▀ █  █ ▀▄▄▀ ▄▄▄█
█▄▄▀ █▄▄█   █   █▄▄█ █▄▄▀      █▄▄▀ █▄▄█ ▄▄▀▄ █▄▄█
        D H A K A   O R D E R   D E S K
</pre>

<p align="center">
  <b>Order by 12:00 noon — it&rsquo;s at your door tonight.</b><br/>
  A Dhaka e-commerce desk with its own riders, a live noon cutoff, an
  exchange desk that asks for exactly one photo of the problem, and a
  WooCommerce-aware catalog layer.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/vite-6.3-F4581C?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/react-18.2-0C3B2E?style=for-the-badge&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/typescript-5.7-16281F?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwind-4.1-2E7D5B?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/timezone-Asia%2FDhaka-FFC531?style=for-the-badge" alt="Asia/Dhaka" />
  <img src="https://img.shields.io/badge/license-MIT-16281F?style=for-the-badge" alt="MIT" />
</p>

---

## Contents

- [What this is](#what-this-is)
- [The shop, aisle by aisle](#the-shop-aisle-by-aisle)
- [Size charts, done properly](#size-charts-done-properly)
- [The exchange desk](#the-exchange-desk)
- [Delivery & exchange fees](#delivery--exchange-fees)
- [WooCommerce category covers](#woocommerce-category-covers)
- [Mobile app (Expo / EAS)](#mobile-app-expo--eas)
- [Quickstart](#quickstart)
- [Project layout](#project-layout)
- [Design system](#design-system)
- [State & data notes](#state--data-notes)
- [License](#license)

---

## What this is

BazarBox is a self-contained storefront + order desk for a small Dhaka shop.
Every flow a customer actually needs is wired end to end: browsing, category
landings, product pages with size guidance, checkout with zone-aware fees,
prepaid delivery, same-day dispatch rules, receipt-style order tracking, and
a photo-evidence exchange workflow. All clocks run on **Asia/Dhaka**, and the
noon cutoff that gates same-day delivery is computed live — not mocked.

| capability | where | notes |
| --- | --- | --- |
| Storefront | `#/` | live dispatch feed, shelf grid, cart drawer |
| Category landings | `#/category/:slug` | cover photo from WooCommerce (with studio fallback) |
| Product landing | `#/product/:id` | integrated size chart, related rail, add-to-bag |
| Exchange desk | `#/exchange` tab | 3-step wizard, photo evidence, fee by zone |
| My Orders | `#/orders` tab | receipt cards, status timelines, barcodes |
| Delivery fees | `#/fees` tab | fee matrix, zone checker, house rules |
| Online payment | modal | bKash / Nagad / Rocket / card — simulated gateway |

## The shop, aisle by aisle

Every category has its own landing page with an editorial cover band,
product count, a strip to the other aisles, and the same-day cutoff strip:

| aisle | landing | chart type |
| --- | --- | --- |
| Footwear | `#/category/footwear` | EU/UK/US fit table + foot length |
| Apparel | `#/category/apparel` | chest / length / shoulder fits |
| Bags | `#/category/bags` | dimensions + capacity specs |
| Audio | `#/category/audio` | dimensions + battery/ANC specs |
| Accessories | `#/category/accessories` | dial / lug / WR specs |
| Home | `#/category/home` | dimensions + material specs |

## Size charts, done properly

The size chart sits *inside* the product landing page rather than behind a
link — it is the sizing experience, not an appendix:

- **cm ↔ inches unit toggle** with values converted on the fly
- **tap-to-mark a row** as *your size* — badged, persisted per product in
  `localStorage`, and re-highlighted on return visits
- **size pills** above the chart stay in sync with the marked row
- **how-to-measure guides** in an accordion, per category
- add-to-bag stays locked until a size is chosen, with a one-line reason:
  picking it now saves an exchange trip later

## The exchange desk

1. **The issue** — pick the delivered order, tick which item(s) arrived
   wrong, choose a reason (*wrong item, damaged, size/fit, missing parts,
   different from photos, quality*), add a note.
2. **Evidence** — drag-and-drop photo upload, 1–4 images (4 MB cap each),
   live previews, required before proceeding.
3. **Pickup & fee** — zone decides the fee; pay online now for a 24-hour
   rider pickup, or cash at pickup within 24–48 hours.

One fee covers **both legs** — the rider picks up the issue item and
delivers the replacement. Out-of-stock swaps become full refunds in 48 h.

## Delivery & exchange fees

| service | inside Dhaka | outside Dhaka | the deal |
| --- | :---: | :---: | --- |
| Standard delivery | **৳60** | **৳130** | 24–48 h inside · 2–4 days outside · COD or prepaid |
| Same-day express | **৳120** | — | prepaid only · order **before 12:00 PM** · at your door 6–10 PM tonight |
| Exchange (both ways) | **৳50** | **৳90** | pickup + replacement re-delivery · photo required |

Prepaying any delivery fee with the built-in gateway (bKash, Nagad, Rocket or
card) bumps the parcel to the **priority dispatch queue** — a rider is
assigned before packing even ends.

## WooCommerce category covers

Category landing pages ask the shop&rsquo;s WooCommerce site for its
product-category list and use each category&rsquo;s catalog image as the
cover. Resolution order:

1. `GET /wp-json/wc/store/v1/products/categories`
2. `GET /wp-json/wc/v3/products/categories?per_page=100`
3. bundled studio cover (renders instantly, never breaks offline)

Requests time out at **4.5 s**; when a live catalog photo arrives it fades in
over the studio cover, and a small badge reports which source supplied it.
See `src/woocom.ts`.

## Mobile app (Expo / EAS)

The companion customer app lives in `apps/mobile` (project
`@sajid.islam/deen-commerce`). Two failed EAS builds were root-caused and
fixed in-repo:

- **iOS `production`** failed on **end-of-life Expo SDK 51** — Apple has
  required Xcode 16 (iOS 18 SDK) binaries since April 2025, and EAS retired
  the Xcode 15 images SDK 51 needs. The app now targets **SDK 55** (RN 0.83,
  React 19.2, expo-router v7) with `eas.json` pinning the iOS image to
  `latest`.
- **Android `production-apk`** then failed at the install step:
  `lucide-react-native@0.394` peers on React ≤18, which can never resolve
  under React 19. The dependency was removed entirely and replaced with an
  in-house 41-glyph stroke icon set on `react-native-svg` — same API, zero
  third-party peer surface left in the app.

Full diagnosis, change tables, and recovery commands
(`npx expo install --fix`, `expo-doctor`, lockfile commit, rebuild) are in
[`apps/mobile/EAS-FIX.md`](./apps/mobile/EAS-FIX.md).

## Quickstart

```bash
npm install        # workspace deps
npm run dev        # local dev server (Vite)
npm run build      # production build → dist/
npm run typecheck  # tsc --noEmit
```

No environment variables, no backend required — the whole desk runs in the
browser with `localStorage` persistence.

## Project layout

```
src/
├── App.tsx           shell · hash router · ticker · ambient route backdrop
├── data.ts           catalog · categories · charts · fees · Dhaka clock
├── woocom.ts         WooCommerce cover fetcher (Store API → REST v3 → fallback)
├── Shop.tsx          storefront · cart drawer · checkout · prepay + same-day rules
├── ProductPage.tsx   product landing with integrated size chart
├── CategoryPage.tsx  per-category landing with WooCommerce cover
├── SizeChart.tsx     interactive fit tables · cm/inch toggle · tap-to-mark
├── Exchange.tsx      3-step exchange wizard · photo evidence · fee by zone
├── Orders.tsx        receipt-style order cards · timelines · barcodes
├── Fees.tsx          fee matrix · zone checker · house rules
├── PaymentModal.tsx  simulated bKash / Nagad / Rocket / card gateway
├── ui.tsx            design system · toasts · scroll reveals · cutoff chip
├── icons.tsx         hand-drawn inline SVG icon set
└── index.css         theme tokens · signature motion (ticker, kenburns, dashes)
```

## Design system

| role | face | used for |
| --- | --- | --- |
| display | **Bricolage Grotesque** | headlines, numerals with character |
| body | **Karla** | all reading copy |
| data | **IBM Plex Mono** | prices, order ids, clocks, tables |

Palette — pine `#0C3B2E` · ink `#16281F` · paper `#EEF1E4` · tangerine
`#F4581C` · sun `#FFC531` · moss `#2E7D5B`. Motion is signature: the marquee
ticker, the animated delivery-route backdrop with riders in transit, Ken
Burns category covers, hard-shadow buttons that press in, and staggered
scroll reveals. All decorative motion honors `prefers-reduced-motion`.

## State & data notes

- Persisted: `bz.orders`, `bz.exchanges`, `bz.cart`, `bz.customer`,
  `bz.size.<productId>` (localStorage).
- Exchange photo previews live in a session-only map (`photoStore`) so
  sensitive evidence never touches disk.
- Payment is simulated client-side; the modal validates wallet/card shapes
  and issues a receipt transaction id, mirroring a real gateway handoff.
- Times and the 12:00 PM same-day cutoff are always resolved in
  **Asia/Dhaka**, wherever the browser is.

## License

MIT — see [LICENSE](./LICENSE).

---

<p align="center"><sub>Built at the Dhaka order desk · riders get chai breaks, it&rsquo;s in the contract.</sub></p>
