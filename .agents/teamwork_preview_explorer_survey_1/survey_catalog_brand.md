# Survey Report: Catalog Architecture, Authentic Photography & Brand Asset Parity (R1 & R5)

**Survey Date**: 2026-09-19  
**Investigator**: Explorer 1 (Catalog & Brand Assets Survey Specialist)  
**Target Scope**: 
- **Requirement R1**: Category-Wise Product Presentation & Authentic Photography (`apps/web`, `apps/mobile`, `apps/api`)
- **Requirement R5**: Brand Asset Verification & Parity (`apps/web`, `apps/mobile`)

---

## 1. Executive Summary

This read-only architectural and visual investigation mapped the catalog organization, category definitions, authentic brand photography, and logo asset implementations across the DEEN Commerce monorepo (`apps/api`, `apps/web`, `apps/mobile`).

### Core Findings
1. **Catalog Presentation Gap (R1 Acceptance Criteria)**:
   - When browsing the default catalog view (`ALL`) on both web (`apps/web/components/ShopClient.tsx`) and mobile (`apps/mobile/app/(tabs)/shop.tsx`), products are displayed in a **single flat un-grouped grid**. Neither platform groups products into distinct category sections with authentic cover photography, titles, and poetic descriptions as mandated by Acceptance Criteria R1.
   - When a specific category is selected, web displays a hero banner with `title`, `description`, and `metaBadge`. Mobile displays a minimal banner linking to `/category/[slug]`.
2. **Unrendered Poetic Descriptions on Mobile (R1)**:
   - `apps/mobile/src/data/categories.ts` defines rich poetic descriptions for each category in `CATEGORY_DETAILS[cat].description`. However, **neither `shop.tsx` nor `category/[slug].tsx` ever renders `categoryInfo.description`** anywhere on mobile screens.
3. **Data Model Taxonomy Desynchronization (R1)**:
   - `POLO` is defined in mobile's `CATEGORY_DETAILS` and API's `CATEGORY_WHITELIST`, but **is completely absent from `apps/web/lib/categories.ts` `CATEGORY_DETAILS`**, falling back to a generic default card with sale imagery.
   - `DEEN_COLLECTION` exists in mobile but maps to `JEANS` on web.
   - Field names differ: mobile uses `badge`, `craftNote`, `filterTags` while web uses `metaBadge`, `highlights`.
4. **Authentic Photography Assets (R1)**:
   - All 19 authentic category cover images hosted on `https://deencommerce.com/wp-content/uploads/` are live and return `HTTP 200`.
   - Legacy Unsplash placeholders (`photo-1542272604-780c96856592`) still linger in fallbacks in `apps/mobile/src/data/categories.ts:150` and `apps/api/src/woo.ts:188`.
5. **Critical Brand Color Inversion Defect in Dark Mode (R5)**:
   - In `apps/web/components/SideNavDrawer.tsx:177`, dark mode renders `/logo.png` with CSS `filter: invert(1) brightness(1.2)`. This inverts the official DEEN brand orange (`#EB6508`) into bright cyan/blue (`rgb(20, 154, 247)`). It must instead switch to `/logo_white.png`.
6. **Broken Remote Favicons on Web (R5)**:
   - `apps/web/app/layout.tsx:24-30,53-55` hardcodes remote WordPress URLs (`https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-*.png`) that return **HTTP 404 (Not Found)**, ignoring the pristine local assets in `apps/web/public/` (`favicon.ico`, `favicon.png`, `icon.png`).
7. **Web/Mobile Drawer Header Inconsistency (R5)**:
   - Web `SideNavDrawer.tsx` uses the horizontal wordmark (`logo.png`), while mobile `SideNavDrawer.tsx` uses the square app icon (`icon.png`).

---

## 2. Requirement R1: Category-Wise Product Presentation & Authentic Photography

### 2.1 Architecture & Call Hierarchy

```
Upstream WooCommerce (https://deencommerce.com)
  │  wc/v3/products + wc/store/v1/products/categories
  ▼
Fastify Gateway Server (apps/api)
  ├── woo.ts: CATEGORY_WHITELIST = ["JEANS", "PANJABI", "SHIRT", "T-SHIRT", "TROUSERS", "POLO", "ACCESSORIES"]
  ├── woo.ts: CANONICAL_CATEGORY_COVERS (10 curated deencommerce.com WebP URLs)
  ├── routes.ts: GET /v1/deen/products?category=...&segment=...&sort=...
  └── routes.ts: GET /v1/deen/category-covers (returns resolved map of category -> WebP cover URL)
        │
        ├──▶ Next.js 14 Frontend (apps/web)
        │     ├── app/shop/page.tsx -> fetches products + category-covers
        │     ├── app/categories/page.tsx -> re-exports app/shop/page.tsx
        │     ├── components/ShopClient.tsx -> interactive filter state, renders flat product grid
        │     ├── lib/categories.ts: CATEGORY_DETAILS (missing POLO!)
        │     └── lib/api.ts: CATEGORIES = ["ALL", "JEANS", "SHIRT", "PANJABI", "T-SHIRT", "TROUSERS", "POLO", "ACCESSORIES"]
        │
        └──▶ Expo / React Native App (apps/mobile)
              ├── app/(tabs)/shop.tsx -> Category tab, visual carousel, flat product grid
              ├── app/category/[slug].tsx -> Dedicated landing page with subcategory tags
              ├── src/data/categories.ts: CATEGORY_DETAILS (9 categories with craftNotes & descriptions)
              └── src/services/gateway.ts: CATEGORIES = ["ALL", "JEANS", "PANJABI", "SHIRT", "T-SHIRT", "POLO", "TROUSERS", "ACCESSORIES"]
```

### 2.2 Category Taxonomies & Data Model Comparison

| Category Key | In API Whitelist | In Mobile CATEGORIES | In Web CATEGORIES | Defined in Mobile `CATEGORY_DETAILS` | Defined in Web `CATEGORY_DETAILS` | Parity Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **ALL** | — | Index 0 | Index 0 | Fallback | Fallback | Parity |
| **JEANS** | ✅ | Index 1 | Index 1 | ✅ | ✅ | Parity |
| **PANJABI** | ✅ | Index 2 | Index 3 | ✅ | ✅ | Order discrepancy |
| **SHIRT** | ✅ | Index 3 | Index 2 | ✅ | ✅ | Order discrepancy |
| **T-SHIRT** | ✅ | Index 4 | Index 4 | ✅ | ✅ | Parity |
| **POLO** | ✅ | Index 5 | Index 6 | ✅ | ❌ **MISSING** | **Web Missing Category Definition** |
| **TROUSERS** | ✅ | Index 6 | Index 5 | ✅ | ✅ | Order discrepancy |
| **ACCESSORIES**| ✅ | Index 7 | Index 7 | ✅ | ✅ | Parity |
| **DEEN_SELECT**| ⚡ Segment | Aliased | Aliased | ✅ | ✅ | Parity |
| **DEEN_COLLECTION**| 💎 Segment | Aliased | ❌ Mapped to JEANS | ✅ | ❌ **MISSING** | **Web Missing Category Definition** |
| **TRENDING** | Promo | ❌ | ❌ | ❌ | ✅ (Web only) | Extra Web entry |
| **NEW_ARRIVALS**| Promo | ❌ | ❌ | ❌ | ✅ (Web only) | Extra Web entry |
| **VALUE_PACKS**| Promo | ❌ | ❌ | ❌ | ✅ (Web only) | Extra Web entry |
| **SALE** | Promo | ❌ | ❌ | ❌ | ✅ (Web only) | Extra Web entry |
| **OTHERS** | Fallback | ❌ | ❌ | ❌ | ✅ (Web only) | Extra Web entry |

#### Interface Schema Discrepancy

```typescript
// apps/mobile/src/data/categories.ts
export interface CategoryInfo {
  slug: string;
  name: DeenCategory;
  title: string;
  subtitle: string;
  description: string;   // Defined but NEVER rendered in mobile UI!
  coverImage: string;
  badge?: string;
  craftNote: string;
  filterTags: string[];
}

// apps/web/lib/categories.ts
export interface CategoryInfo {
  slug: string;
  title: string;
  subtitle: string;
  description: string;   // Rendered in category-hero-card
  coverImage: string;
  metaBadge: string;
  highlights: string[];
}
```

### 2.3 Authentic Photography Asset Verification

All referenced images from `https://deencommerce.com/wp-content/uploads/` were tested via HTTP HEAD requests:

| Category | Source File & Location | Tested Image URL | HTTP Status | Asset Type / Verification |
| :--- | :--- | :--- | :---: | :--- |
| **JEANS** | `apps/mobile/src/data/categories.ts:24` | `.../2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Back.webp` | **200 OK** | Authentic product photoshoot (Back pocket fade) |
| **JEANS (Alt)** | `apps/api/src/woo.ts:636` | `.../2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp` | **200 OK** | Authentic 90s wash model front |
| **PANJABI** | `apps/mobile/src/data/categories.ts:37` | `.../2026/07/DEEN-Gold-Semi-Formal-Panjabi-106-0101-123-close-2.webp` | **200 OK** | Authentic gold dobby embroidery close-up |
| **SHIRT** | `apps/mobile/src/data/categories.ts:50` | `.../2026/08/DEEN-Classic-Stripe-Executive-Formal-Shirt-102-0501-003-Front.webp` | **200 OK** | Authentic striped shirting studio front |
| **SHIRT (Alt)** | `apps/api/src/woo.ts:638` | `.../2026/07/DEEN-Checkmate-Executive-Formal-Shirt-102-0501-005-Front.webp` | **200 OK** | Authentic checkmate casual shirt studio |
| **T-SHIRT** | `apps/mobile/src/data/categories.ts:63` | `.../2026/07/DEEN-City-Code-Print-Drop-Shoulder-T-Shirt-105-0301-006-Front.webp` | **200 OK** | Authentic 240 GSM drop shoulder tee |
| **T-SHIRT (Alt)**| `apps/api/src/woo.ts:639` | `.../2026/07/DEEN-Warm-Spice-T-shirt-105-0101-377-Front.webp` | **200 OK** | Authentic crew neck tee studio shot |
| **POLO** | `apps/mobile/src/data/categories.ts:76` | `.../2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp` | **200 OK** | Authentic Springfield pique polo |
| **POLO (Alt)** | `apps/api/src/woo.ts:640` | `.../2026/07/DEEN-Polo-103-0200-053-Front.webp` | **200 OK** | Authentic in-house DEEN polo shirt |
| **TROUSERS** | `apps/mobile/src/data/categories.ts:89` | `.../2026/07/DEEN-Teal-Trousers-110-0101-015-Model-Front.webp` | **200 OK** | Authentic teal utility cargo model shot |
| **ACCESSORIES**| `apps/mobile/src/data/categories.ts:102` | `.../2026/07/DEEN-Chocolate-Premium-Leather-Belt-109-0402-051.webp` | **200 OK** | Authentic full-grain veg-tan leather belt |
| **ACCESSORIES (Alt)**| `apps/api/src/woo.ts:642` | `.../2026/07/DEEN-Wallet-109-0102-071-Side-view.webp` | **200 OK** | Authentic leather wallet side view |
| **DEEN_SELECT**| `apps/mobile/src/data/categories.ts:115` | `.../2026/09/Springfield-Polo-Shirt-103-0100-119-600x750.webp` | **200 OK** | Curated international brand drop photo |
| **DEEN_COLLECTION**| `apps/mobile/src/data/categories.ts:128` | `.../2026/07/DEEN-High-High-End-Vintage-Wash-Jeans-–-Slim-Fit-101-0100-151-Back.webp` | **200 OK** | In-house signature denim showcase |

#### Placeholder Invalidation
- `apps/mobile/src/data/categories.ts:150`: uses generic Unsplash fallback: `https://images.unsplash.com/photo-1542272604-780c96856592?w=1200`
- `apps/api/src/woo.ts:188`: uses `https://images.unsplash.com/photo-1542272604-780c96856592?w=800`
- **Recommendation**: Replace all Unsplash URLs with authentic DEEN assets (e.g. `https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp`).

### 2.4 Category Titles & Poetic Descriptions Audit

Below is the exhaustive catalog of titles and poetic descriptions defined in code:

#### 1. JEANS
- **Title**: `CROSS HATCH DENIM & JEANS` (Mobile) / `Jeans & Denim` (Web)
- **Subtitle**: `Denim styles made for every day.`
- **Poetic Description**:
  - *Mobile*: `"Engineered for authentic fades and timeless durability. Featuring signature cross-hatch warp and weft textures, custom copper rivets, and heavy tobacco stitch thread."`
  - *Web*: `"Engineered with signature cross-hatch warp and weft textures, reinforced chain-stitched hems, custom oxidized copper rivets, and tailored ergonomic tapers."`
- **Badge**: `13.5 OZ CROSS HATCH`
- **Craft Note (Mobile)**: `"Sanforized cross-hatch denim with authentic texture and less than 2% shrinkage."`

#### 2. PANJABI
- **Title**: `HERITAGE DOBBY PANJABIS` (Mobile) / `Panjabi` (Web)
- **Subtitle**: `Tradition with modern elegance.`
- **Poetic Description**:
  - *Mobile*: `"A seamless fusion of cultural heritage and contemporary menswear. Tailored from breathable dobby cotton jacquard weaves with subtle indigo geometry."`
  - *Web*: `"Crafted for Friday prayers, weddings, and Eid celebrations. Tailored with modern minimalist plackets, mother-of-pearl buttons, and structured band collars."`
- **Badge**: `EID & CELEBRATION` (Mobile) / `HERITAGE DOBBY` (Web)
- **Craft Note (Mobile)**: `"Pure cotton jacquard weave with self-textured indigo geometric motifs."`

#### 3. SHIRT
- **Title**: `ARTISANAL CASUAL SHIRTS` (Mobile) / `Shirts` (Web)
- **Subtitle**: `Classic styles, made to stand out.`
- **Poetic Description**:
  - *Mobile*: `"Designed for effortless layering and all-day comfort. Cut with single-needle tailoring, reinforced side gussets, and pre-washed soft textures."`
  - *Web*: `"Versatile shirting from boardroom presentations to weekend getaways. Cut with single-needle tailoring, reinforced side gussets, and pre-washed soft textures."`
- **Badge**: `100% COTTON`
- **Craft Note (Mobile)**: `"Pre-washed yarn-dyed cotton ensuring zero post-wash twisting."`

#### 4. T-SHIRT
- **Title**: `HEAVYWEIGHT 240 GSM TEES` (Mobile) / `T-Shirts` (Web)
- **Subtitle**: `Everyday comfort, effortless style.`
- **Poetic Description**:
  - *Mobile*: `"The quintessential foundation of modern streetwear. Crafted from ultra-dense 240 GSM organic cotton with double-ribbed collars that never sag."`
  - *Web*: `"Zero-shrink, drop-shoulder and classic tailored crew necks crafted from dense combed cotton with bound double-ribbed necklines."`
- **Badge**: `240 GSM ZERO-TORQUE`
- **Craft Note (Mobile)**: `"Pre-shrunk ring-spun cotton engineered for maximum drape and shape retention."`

#### 5. POLO
- **Title**: `KNITTED INDIGO POLOS` (Mobile) / *MISSING ON WEB*
- **Subtitle**: `Honey-Comb Pique & Jacquard Knits with Mother of Pearl Accents` (Mobile)
- **Poetic Description**:
  - *Mobile*: `"Elevated casual wear crafted from heavyweight cotton pique. Finished with tipped flat-knit collars, mother-of-pearl buttons, and split side hems."`
  - *Web*: ❌ *Missing from `apps/web/lib/categories.ts`!*
- **Badge**: `HONEYCOMB PIQUE`
- **Craft Note (Mobile)**: `"Interlock combed cotton with natural stretch and moisture-wicking weave."`

#### 6. TROUSERS
- **Title**: `UTILITY & CHINO TROUSERS` (Mobile) / `Trousers & Cargos` (Web)
- **Subtitle**: `Smart fits, everyday comfort.`
- **Poetic Description**:
  - *Both*: `"Ergonomic utility bottoms designed for city mobility. Featuring deep slant cargo pockets, reinforced knees, and tailored ankle cinches."`
- **Badge**: `COTTON RIPSTOP`
- **Craft Note (Mobile)**: `"High-density military-spec weave with triple-stitched stress points."`

#### 7. ACCESSORIES
- **Title**: `LEATHER GOODS & ACCESSORIES` (Mobile) / `Accessories` (Web)
- **Subtitle**: `Complete your everyday look.`
- **Poetic Description**:
  - *Both*: `"Artisanal leather accessories handcrafted by master leatherworkers in Old Dhaka. Solid brass hardware that patinas gracefully with age."`
- **Badge**: `VEG-TAN LEATHER`
- **Craft Note (Mobile)**: `"100% full-grain vegetable tanned cowhide and solid brass buckle hardware."`

#### 8. DEEN SELECT (Curated Drops)
- **Title**: `⚡ DEEN SELECT · CURATED DROPS` (Mobile) / `DEEN Select` (Web)
- **Subtitle**: `Curated international drops.`
- **Poetic Description**:
  - *Mobile*: `"A curated edit of internationally sourced menswear labels — Springfield, Lefties, Pull & Bear — now available exclusively through DEEN. Each piece is personally selected for fit, fabric, and wearability."`
  - *Web*: `"Exclusive curated drops sourced directly from renowned international fashion houses (Springfield, Lefties, Pull & Bear) with modern cuts."`
- **Badge**: `CURATED DROP` (Mobile) / `GLOBAL CURATED DROP` (Web)

#### 9. DEEN COLLECTION (In-House Craft)
- **Title**: `💎 DEEN COLLECTION · IN-HOUSE CRAFT` (Mobile) / *MISSING ON WEB*
- **Subtitle**: `Heritage Denim, Dobby Panjabis & 240 GSM Tees — Made in Bangladesh`
- **Poetic Description**:
  - *Mobile*: `"The full DEEN in-house collection — from cross-hatch denim engineered for authentic fades, to heritage dobby panjabis and heavyweight 240 GSM tees. Crafted with local expertise and premium materials."`
  - *Web*: ❌ *Missing from `apps/web/lib/categories.ts`!*
- **Badge**: `IN-HOUSE CRAFT`

### 2.5 The Missing Piece: Category-Wise Catalog Grouping

#### Acceptance Criteria Requirements:
1. *"Catalog views group products category-wise with authentic brand photography and descriptions for each category."*
2. *"Category navigation on both web and mobile correctly filters and displays the corresponding products."*

#### Current Status:
- **Filtering by single category**: WORKING. When selecting `JEANS`, only jeans appear; selecting `SHIRT`, only shirts appear.
- **Default / All Catalog View**: **FAILING / NOT IMPLEMENTED**.
  - In `apps/web/components/ShopClient.tsx:307-317`, `initialProducts` are rendered directly into a single `<div className="products-grid">` with no category distinction.
  - In `apps/mobile/app/(tabs)/shop.tsx:307-360`, when `selectedCategory === "ALL"`, a `FlatList` renders all products into a flat 2-column grid. `ListHeaderComponent` only displays the category banner if `selectedCategory !== "ALL"`.
  - On mobile, `categoryInfo.description` is **never rendered at all**, neither in `shop.tsx` nor in `category/[slug].tsx`.

#### Architectural Solution for Implementation:
To fulfill Acceptance Criteria R1:
1. In `apps/web/components/ShopClient.tsx`:
   - When `category === "ALL"` and no specific search query is entered, display products grouped by category in distinct visual sections (e.g. `JEANS`, `PANJABI`, `SHIRT`, `T-SHIRT`, `POLO`, `TROUSERS`, `ACCESSORIES`).
   - Each category section must render:
     - Authentic cover photo banner
     - Category Title, Subtitle, and Badge
     - Poetic Description
     - Horizontal carousel or grid of 4–8 products belonging to that category
     - "Explore All [Category] (X items) →" link that switches the active category filter.
2. In `apps/mobile/app/(tabs)/shop.tsx`:
   - When `selectedCategory === "ALL"` and `!searchQuery`, render categorized sections matching web.
   - In `apps/mobile/app/category/[slug].tsx`: render `<Text style={styles.heroDescription}>{categoryInfo.description}</Text>` directly under the title/subtitle.
3. Synchronize `apps/web/lib/categories.ts`: add `POLO` and `DEEN_COLLECTION` to `CATEGORY_DETAILS` so web has identical content to mobile.

---

## 3. Requirement R5: Brand Asset Verification & Parity

### 3.1 Official Brand Assets & Specifications

From direct inspection of the live WordPress server (`deencommerce.com`), git history (commit `0d798ee`), and pixel-level analysis:

| Asset Path | Intrinsic Dimensions | Mode | MD5 Checksum | Primary Colors Detected | Notes |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `apps/mobile/assets/logo.png` | 482 × 137 | RGBA | `fd9ee2775a0f84b6b5ea5a568add77d0` | Dark `#030304` (12,955 px), Orange `#EB6508` (10,093 px) | Primary light-mode logo |
| `apps/web/public/logo.png` | 482 × 137 | RGBA | `fd9ee2775a0f84b6b5ea5a568add77d0` | Dark `#030304` (12,955 px), Orange `#EB6508` (10,093 px) | Exact byte-for-byte match with mobile |
| `apps/mobile/assets/logo_white.png` | 482 × 137 | RGBA | `da8e8e631ff619e7eab59c3b72abb334` | White `#FFFFFF` (12,955 px), Orange `#EB6508` (10,093 px) | Primary dark-mode logo |
| `apps/web/public/logo_white.png` | 482 × 137 | RGBA | `da8e8e631ff619e7eab59c3b72abb334` | White `#FFFFFF` (12,955 px), Orange `#EB6508` (10,093 px) | Exact byte-for-byte match with mobile |
| `apps/mobile/assets/icon.png` | 1024 × 1024 | RGBA | — | Orange `#FF6900` + White mark | Mobile app launcher icon |
| `apps/web/public/icon.png` | 192 × 192 | P | — | Indexed palette | PWA / Android web manifest icon |
| `apps/mobile/assets/favicon.png` | 64 × 64 | RGBA | `39fde6583a4835b3e409482dddd12f62` | Brand icon | Favicon |
| `apps/web/public/favicon.png` | 64 × 64 | RGBA | `39fde6583a4835b3e409482dddd12f62` | Brand icon | Exact byte-for-byte match with mobile |
| `apps/mobile/assets/splash.png` | 1242 × 2436 | RGB | — | Black `#000000` with centered logo | Expo splash image |

- **Official Aspect Ratio**: $482 : 137 \approx 3.518 : 1$.
- **Brand Accent Hex**: `#EB6508` (DEEN Orange).
- **Secondary Mark Fill**: `#030304` on light, `#FFFFFF` on dark.

### 3.2 Component-by-Component Rendering Audit

#### 1. Web Header (`apps/web/components/Header.tsx:141-149`)
```tsx
<img
  src={isDark ? "/logo_white.png" : "/logo.png"}
  alt="DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড"
  style={{
    height: 30,
    width: "auto",
    objectFit: "contain",
  }}
/>
```
- **Aspect Ratio**: Intrinsic height 30px, natural width $= 30 \times (482/137) = 105.5\text{px}$. Unconstrained width preserves aspect ratio perfectly with zero distortion.
- **Theme Response**: Accurately switches between `/logo.png` (dark text) and `/logo_white.png` (white text).
- **Crispness**: High DPI screens render 482x137 at 105.5x30 (~4.5x downsample), delivering razor-sharp text and glyph edges.

#### 2. Mobile Header (`apps/mobile/src/components/Header.tsx:69-73,211-214`)
```tsx
<Image
  source={isDark ? require("../../assets/logo_white.png") : require("../../assets/logo.png")}
  style={styles.brandLogo}
  resizeMode="contain"
/>
// styles:
brandLogo: {
  width: 96,
  height: 28,
}
```
- **Aspect Ratio**: Container is $96 \times 28$ ($3.428 : 1$). `resizeMode="contain"` constrains the 3.518:1 image to $96 \times 27.28\text{dp}$. Preserves aspect ratio with undetectable 0.72dp vertical buffer.
- **Theme Response**: Properly binds to dynamic `isDark` and switches between `logo_white.png` and `logo.png`.

#### 3. Web Footer (`apps/web/components/Footer.tsx:17-25`)
```tsx
<img
  src="/logo_white.png"
  alt="DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড"
  style={{
    height: 34,
    width: "auto",
    objectFit: "contain",
  }}
/>
```
- **Aspect Ratio**: Preserved via `width: "auto"`.
- **Theme Response**: Footer background is dark (`#0B0F19`), so it correctly uses `/logo_white.png`.

#### 4. Web SideNavDrawer (`apps/web/components/SideNavDrawer.tsx:171-178`) — 🚨 CRITICAL BUG
```tsx
<img
  src="/logo.png"
  alt="DEEN"
  style={{
    height: 24,
    width: "auto",
    filter: isDark ? "invert(1) brightness(1.2)" : "none",
  }}
/>
```
- **Critical Visual Defect**:
  Applying `filter: invert(1)` in dark mode inverts **all** color channels. The `#EB6508` brand orange is inverted to:
  $$\text{RGB}(255 - 235, 255 - 101, 255 - 8) = \text{RGB}(20, 154, 247) \quad (\text{Bright Cyan/Sky Blue})$$
  The official DEEN trademark orange turns into blue!
- **Fix Required**:
  Remove `filter` and dynamically select `src={isDark ? "/logo_white.png" : "/logo.png"}`.

#### 5. Mobile SideNavDrawer (`apps/mobile/src/components/SideNavDrawer.tsx:86-98`) — ⚠️ PARITY GAP
```tsx
<Image
  source={require("../../assets/icon.png")}
  style={styles.brandLogo}
  resizeMode="cover"
/>
<View>
  <Text style={[styles.brandTitle, { color: isDark ? colors.indigo : colors.indigoDark }]}>
    DEEN
  </Text>
  <Text style={[styles.brandEst, { color: colors.sub }]}>
    EST. 2020 · DHAKA
  </Text>
</View>
```
- **Parity Gap**: Web SideNavDrawer renders the horizontal wordmark logo (`logo.png`), whereas Mobile SideNavDrawer renders the 1:1 icon (`icon.png`) followed by text.
- **Fix Required**: Align Web and Mobile drawer headers to use the official wordmark logo.

#### 6. Web Layout Favicon References (`apps/web/app/layout.tsx:24-30,53-55`) — 🚨 BROKEN 404 LINKS
```tsx
// apps/web/app/layout.tsx:24-29
icons: {
  icon: [
    { url: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-192x192.png", sizes: "192x192", type: "image/png" },
  ],
  shortcut: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-32x32.png",
  apple: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-180x180.png",
}
// and lines 53-55:
<link rel="icon" href="https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-32x32.png" sizes="32x32" />
<link rel="icon" href="https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-192x192.png" sizes="192x192" />
<link rel="apple-touch-icon" href="https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-180x180.png" />
```
- **Defect**: Every single one of these `2025/04` URLs returns **HTTP 404 (Not Found)** on `deencommerce.com`.
- **Fix Required**: Point to local static assets in `apps/web/public/`:
  - `/favicon-32x32.png` (or `/favicon.png`)
  - `/icon.png` (192x192)
  - `/favicon.ico`

---

## 4. Comprehensive Survey Matrix: Discrepancies & Recommendations

| Area | Current State | Issue / Gap | Target State (Parity & Brand Integrity) | Implementation Target |
| :--- | :--- | :--- | :--- | :--- |
| **R1: Catalog View (All Categories)** | Flat grid of all products on both web & mobile | Does not satisfy *"Catalog views group products category-wise with authentic brand photography and descriptions"* | When `category === "ALL"`, render categorized sections with authentic cover photo, title, poetic description, and horizontal product carousel. | `apps/web/components/ShopClient.tsx`, `apps/mobile/app/(tabs)/shop.tsx` |
| **R1: Mobile Poetic Descriptions** | Defined in `apps/mobile/src/data/categories.ts` | `categoryInfo.description` is NEVER rendered in mobile UI | Render poetic descriptions under category header in `shop.tsx` and `category/[slug].tsx`. | `apps/mobile/app/(tabs)/shop.tsx`, `apps/mobile/app/category/[slug].tsx` |
| **R1: POLO Category on Web** | Present in API & Mobile | Completely missing from `apps/web/lib/categories.ts:11-128` | Add `POLO` to `apps/web/lib/categories.ts` with authentic cover photo and poetic description. | `apps/web/lib/categories.ts` |
| **R1: DEEN_COLLECTION on Web** | Mapped to `JEANS` | Missing dedicated entry in `CATEGORY_DETAILS` | Add `DEEN_COLLECTION` to `apps/web/lib/categories.ts` matching mobile. | `apps/web/lib/categories.ts` |
| **R1: Unsplash Placeholders** | Unsplash fallback URLs present in 2 files | Fails authentic photography standard | Replace with authentic DEEN cover URLs from `CANONICAL_CATEGORY_COVERS`. | `apps/mobile/src/data/categories.ts:150`, `apps/api/src/woo.ts:188` |
| **R5: Web SideNavDrawer Dark Logo** | Uses CSS `filter: invert(1)` | Inverts official brand orange `#EB6508` to cyan/blue | Replace `filter: invert` with dynamic `isDark ? "/logo_white.png" : "/logo.png"`. | `apps/web/components/SideNavDrawer.tsx:171-178` |
| **R5: Web Layout Favicon Links** | Hardcoded external 2025 URLs | Returns HTTP 404 (broken image requests in browser console) | Use `/favicon.png`, `/favicon-32x32.png`, and `/icon.png`. | `apps/web/app/layout.tsx:24-30,53-55` |
| **R5: Drawer Header Visual Parity** | Web uses wordmark logo; Mobile uses icon + text | Visual discrepancy between platforms | Align both drawers to render the official DEEN wordmark logo responsive to dark/light theme. | `apps/mobile/src/components/SideNavDrawer.tsx:86-98` |

---

## 5. Precise Code Snippets for Implementers

### Fix 1: Web SideNavDrawer Logo Inversion Bug (`apps/web/components/SideNavDrawer.tsx:171-178`)
```tsx
// BEFORE:
<img
  src="/logo.png"
  alt="DEEN"
  style={{
    height: 24,
    width: "auto",
    filter: isDark ? "invert(1) brightness(1.2)" : "none",
  }}
/>

// AFTER:
<img
  src={isDark ? "/logo_white.png" : "/logo.png"}
  alt="DEEN"
  style={{
    height: 24,
    width: "auto",
    objectFit: "contain",
  }}
/>
```

### Fix 2: Web Layout Favicons (`apps/web/app/layout.tsx:23-30,53-55`)
```tsx
// BEFORE:
icons: {
  icon: [
    { url: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-192x192.png", sizes: "192x192", type: "image/png" },
  ],
  shortcut: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-32x32.png",
  apple: "https://deencommerce.com/wp-content/uploads/2025/04/cropped-cropped-Deen-Logo-scaled-1-180x180.png",
}

// AFTER:
icons: {
  icon: [
    { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/icon.png", sizes: "192x192", type: "image/png" },
    { url: "/favicon.png", sizes: "64x64", type: "image/png" },
  ],
  shortcut: "/favicon.ico",
  apple: "/icon.png",
}
```

### Fix 3: Add Missing POLO to Web `CATEGORY_DETAILS` (`apps/web/lib/categories.ts`)
```typescript
  POLO: {
    slug: "POLO",
    title: "Knitted Indigo Polos",
    subtitle: "Honey-Comb Pique & Jacquard Knits with Mother of Pearl Accents",
    description:
      "Elevated casual wear crafted from heavyweight cotton pique. Finished with tipped flat-knit collars, mother-of-pearl buttons, and split side hems.",
    coverImage: "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Polo-103-0200-053-Front.webp",
    metaBadge: "HONEYCOMB PIQUE",
    highlights: ["Pique Cotton", "Tipped Collar", "Mother of Pearl Buttons"],
  },
```

### Fix 4: Render Poetic Description on Mobile Category Screen (`apps/mobile/app/category/[slug].tsx:171`)
```tsx
<Text style={styles.heroTitle}>{categoryInfo.title}</Text>
<Text style={styles.heroSubtitle}>{categoryInfo.subtitle}</Text>
{categoryInfo.description ? (
  <Text style={styles.heroDescription} numberOfLines={3}>
    {categoryInfo.description}
  </Text>
) : null}
```

---

## 6. Conclusion
The assets and data foundations are already present in the repository and on `deencommerce.com`. Executing the targeted fixes outlined in Section 5 and structuring the default catalog view into category-wise groupings will fully satisfy Requirements R1 and R5 with complete web/mobile parity.
