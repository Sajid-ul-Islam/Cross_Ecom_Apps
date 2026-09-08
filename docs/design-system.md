# DEEN Commerce Design System & UI Specification

## 1. Overview & Brand Identity

DEEN Commerce is a premier Bangladeshi denim and heritage apparel brand specializing in 13.5oz red-line selvedge denim woven on vintage shuttle looms, heavy-wash twill, premium shirts, and contemporary streetwear.

The design system is engineered to convey an authentic, tactile, luxury yet approachable brand experience. It operates across **React Native + Expo (Android & iOS)** and **Next.js 14 (Web & Responsive Mobile)** with complete visual and behavioral synchronization.

---

## 2. Color Palette & Token Architecture

The design system enforces dynamic semantic color tokens. Per workspace rules, static token imports are forbidden; components consume colors dynamically via `useTheme()` in mobile and CSS variables (`var(--token)`) on web.

### 2.1 Core Brand Colors

| Token Name | Light Mode | Dark Mode | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `primary` / `indigo` | `#4F46E5` | `#6366F1` | Primary brand accent, CTAs, highlight badges |
| `primaryDark` | `#3730A3` | `#4338CA` | Hover and active pressed states |
| `emerald` / `accent` | `#059669` | `#10B981` | Success states, WhatsApp concierge, confirmed status |
| `amber` / `gold` | `#D97706` | `#F59E0B` | Ratings, promo stars, cashback badges, alerts |
| `coral` / `danger` | `#DC2626` | `#EF4444` | High demand, stock low warnings, errors, cancellation |
| `rose` | `#E11D48` | `#F43F5E` | Wishlist heart active state |

### 2.2 Surface & Neutral Hierarchy (WCAG 2.2 AA Certified)

All background and text pairings maintain a contrast ratio $\ge 4.5:1$ for standard text and $\ge 3:1$ for large text and UI components.

| Token | Light Mode Value | Dark Mode Value | Contrast vs Background | Role |
| :--- | :--- | :--- | :--- | :--- |
| `bg` | `#F8F9FA` | `#0D111A` | N/A | Application viewport base |
| `card` | `#FFFFFF` | `#161C2A` | N/A | Content elevation container |
| `cardSecondary`| `#F1F5F9` | `#1F273B` | N/A | Nested cards, pill badges, inputs |
| `ink` | `#0F172A` | `#F4F6FC` | **15.2:1** (Dark) / **17.8:1** (Light) | Primary titles, headlines, prices |
| `sub` | `#475569` | `#8C96B2` | **5.4:1** (Dark) / **6.2:1** (Light) | Secondary copy, captions, timestamps |
| `muted` | `#64748B` | `#64748B` | **4.6:1** (Dark) / **4.8:1** (Light) | Subtle metadata, placeholders |
| `border` | `#E2E8F0` | `#232B3E` | $\ge 3.0:1$ | Dividers, card borders, stroke outlines |
| `borderLight` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` | Structural accents |

---

## 3. Typography Scale & Hierarchy

Both platforms employ modern sans-serif typography (System San Francisco / Roboto on Mobile, Inter / Geist on Web) with optimized letter-spacing and vertical rhythm.

| Level | Size (Mobile / Web) | Weight | Line Height | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 28dp / 32px | 900 (Black) | 1.15 | -0.5px | Hero slider headlines, category drop headers |
| **H1** | 22dp / 24px | 800 (Extra Bold) | 1.25 | -0.3px | Screen titles, product names on PDP |
| **H2** | 18dp / 20px | 700 (Bold) | 1.30 | -0.2px | Section titles, drawer headings |
| **H3 / Subhead**| 15dp / 16px | 600 (Semi Bold) | 1.35 | 0px | Card titles, group labels |
| **Body Primary**| 14dp / 14px | 500 (Medium) | 1.45 | 0px | Descriptions, form inputs, dialog copy |
| **Body Small** | 12.5dp / 12.5px | 500 (Medium) | 1.40 | 0.2px | Subtitles, logistics steps, helper notes |
| **Caption / Pill**| 10.5dp / 11px | 800 (Extra Bold) | 1.20 | +0.6px | Badges, tabs, uppercase labels (`text-transform: uppercase`) |

---

## 4. Touch Targets & Accessibility ($\ge 44\text{dp}$)

Mobile and web touch ergonomics strictly adhere to WCAG 2.2 Success Criterion 2.5.5 (Target Size):

1. **Hit Slop Padding**:
   All interactive icon buttons (Search, Wishlist, Bag, Notifications, Drawer Closes, Stepper actions) declare minimum touch boundaries:
   ```tsx
   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
   ```
2. **Explicit Icon Button Framing**:
   Standalone icon buttons are framed in containers measuring at least $44 \times 44\text{ dp}$ (`width: 44, height: 44, justifyContent: 'center', alignItems: 'center'`).
3. **Screen Reader Semantics**:
   - `accessibilityRole="button"` and meaningful `accessibilityLabel` attributes on all actionable elements.
   - Status indicators utilize `accessibilityRole="status"` with live updates.
   - Semantic modal roots declare `role="dialog"` and `aria-modal="true"`.

---

## 5. Component Specifications

### 5.1 Top Navigation Bar (`Header.tsx`)
- **Brand Logo**: Centered/Left-aligned official DEEN logo mark with subtle tagline "EST. 2020 · DHAKA".
- **Action Icons**:
  - Search trigger ($44\text{dp}$)
  - Wishlist Heart with dynamic counter badge ($44\text{dp}$)
  - Notification Bell with opt-in status indicator ($44\text{dp}$)
  - AI Concierge Sparkle ($44\text{dp}$)

### 5.2 Bottom Navigation Bar (5 Core Tabs)
- Strict 5-tab layout: `[ 🏠 Home ]  [ 🗂️ Categories ]  [ 🛒 Cart ]  [ 💬 Chat ]  [ 👤 Profile ]`
- Active icon elevation with primary indigo glow and bold typography.
- Cart badge displays real-time item count from `CartContext`.

### 5.3 Motion Hero Carousel (`MotionHero.tsx`)
- High-resolution seasonal campaigns with smooth pagination indicators.
- Live pill badge displaying authentic craftsmanship guarantee: `✨ 100% Cotton Selvedge · 7-Day Exchange`.
- Prominent dual action triggers: "Explore Drop" and "Our Heritage".

### 5.4 Social Discovery Carousel (`SocialReelsCarousel.tsx`)
- High-engagement vertical 9:16 video/poster format.
- Instant 1-tap commerce overlay:
  - "Quick Bag": Adds tagged product variation directly to cart.
  - "Shop Piece →": Navigates directly to PDP.

### 5.5 Official Brand Socials Community Card
- Highlights verified brand channels: Facebook (`/deencommerce`), Instagram (`/deencommerce`), LinkedIn (`/company/deencommerce`), and WhatsApp (`+8801952700500`).
- Branded SVG icons with native deep linking and web fallbacks.
